// Import Models
const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const KitchenTicket = require('../models/KitchenTicket');
const Inventory = require('../models/Inventory');

// Import Socket.io emission helpers
const { emitNewOrder, emitOrderStatusUpdate } = require('../utils/socketEvents');

// @desc    Create a new order from a table (QR scan ordering)
// @route   POST /api/orders
// @access  Public (or Authenticated)
const createOrder = async (req, res, next) => {
    try {
        const { tableId, tableNumber, items, customerName } = req.body;

        // 1. Basic validation
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'An order must contain at least one item'
            });
        }

        // 2. Validate table
        let targetTable;
        if (tableId) {
            targetTable = await Table.findById(tableId);
        } else if (tableNumber) {
            targetTable = await Table.findOne({ tableNumber });
        }

        if (!targetTable) {
            return res.status(404).json({
                success: false,
                message: 'Specified table does not exist'
            });
        }

        // 3. Process ordered items, calculate subtotal and snapshot prices
        let processedItems = [];
        let subTotal = 0;

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(404).json({
                    success: false,
                    message: `Menu item with ID ${item.menuItemId} was not found`
                });
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Item '${menuItem.name}' is currently out of stock`
                });
            }

            // Calculate item price including any selected customizations
            let itemPrice = menuItem.price;
            let customOptions = [];

            if (item.selectedCustomizations && item.selectedCustomizations.length > 0) {
                item.selectedCustomizations.forEach(cust => {
                    itemPrice += cust.additionalPrice || 0;
                    customOptions.push({
                        name: cust.name,
                        additionalPrice: cust.additionalPrice || 0
                    });
                });
            }

            const quantity = Number(item.quantity) || 1;
            const itemTotal = itemPrice * quantity;
            subTotal += itemTotal;

            processedItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                quantity: quantity,
                price: itemPrice,
                selectedCustomizations: customOptions,
                itemNotes: item.itemNotes || ''
            });

            // Increment popularity count for analytics
            menuItem.ordersCount = (menuItem.ordersCount || 0) + quantity;
            await menuItem.save();
        }

        // 4. Calculate tax (5% GST) and total
        const tax = Math.round(subTotal * 0.05);
        const totalAmount = subTotal + tax;

        // 5. Generate human-readable order number (e.g. ORD-172948-284)
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

        // 6. Create Order in MongoDB
        const order = await Order.create({
            orderNumber,
            table: targetTable._id,
            tableNumber: targetTable.tableNumber,
            customer: req.user ? req.user._id : null,
            customerName: customerName || (req.user ? req.user.name : 'Guest Customer'),
            items: processedItems,
            subTotal,
            tax,
            totalAmount,
            status: 'pending'
        });

        // 7. Update Table status to occupied and link order
        targetTable.status = 'occupied';
        targetTable.currentOrder = order._id;
        await targetTable.save();

        // 8. Automatically generate Kitchen Ticket (KOT) for chefs and waiters
        const kitchenTicketItems = processedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            customizations: item.selectedCustomizations.map(c => c.name),
            itemNotes: item.itemNotes
        }));

        await KitchenTicket.create({
            order: order._id,
            orderNumber: order.orderNumber,
            tableNumber: targetTable.tableNumber,
            items: kitchenTicketItems,
            status: 'received',
            priority: 'normal'
        });

        // 9. Real-time Socket.io Broadcast to Kitchen and Table room!
        emitNewOrder(order);

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all orders (with optional status / table filters)
// @route   GET /api/orders
// @access  Private (Staff, Manager, Admin)
const getOrders = async (req, res, next) => {
    try {
        const { status, tableNumber } = req.query;

        let query = {};
        if (status) query.status = status;
        if (tableNumber) query.tableNumber = Number(tableNumber);

        const orders = await Order.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('table', 'tableNumber capacity')
            .populate('customer', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order with ID ${req.params.id} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status (e.g. pending -> preparing -> ready -> served -> paid)
// @route   PUT /api/orders/:id/status
// @access  Private (Staff, Kitchen, Manager, Admin)
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order with ID ${req.params.id} not found`
            });
        }

        // Update status
        order.status = status;
        if (status === 'paid') {
            order.paymentStatus = 'paid';

            // Free up the table
            const table = await Table.findById(order.table);
            if (table) {
                table.status = 'available';
                table.currentOrder = null;
                await table.save();
            }
        }

        await order.save();

        // Also update corresponding kitchen ticket status
        if (['preparing', 'ready'].includes(status)) {
            await KitchenTicket.findOneAndUpdate(
                { order: order._id },
                { status: status === 'preparing' ? 'in_progress' : 'ready_for_pickup' }
            );
        } else if (['served', 'paid'].includes(status)) {
            await KitchenTicket.findOneAndUpdate(
                { order: order._id },
                { status: 'served' }
            );
        }

        // Real-time broadcast status change via Socket.io!
        emitOrderStatusUpdate(order);

        res.status(200).json({
            success: true,
            message: `Order status updated to '${status}'`,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
};
