// Import KitchenTicket model
const KitchenTicket = require('../models/KitchenTicket');
const Order = require('../models/Order');

// @desc    Get active kitchen tickets for chefs and waiters
// @route   GET /api/kitchen
// @access  Private (Kitchen, Staff, Manager)
const getKitchenTickets = async (req, res, next) => {
    try {
        const { status, station } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        } else {
            // By default, exclude tickets that are already served
            query.status = { $ne: 'served' };
        }

        if (station) {
            query.station = station;
        }

        const tickets = await KitchenTicket.find(query)
            .sort({ priority: -1, createdAt: 1 }) // Rush priority first, then oldest first (FIFO)
            .populate('order');

        res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update kitchen ticket status (e.g. received -> in_progress -> ready_for_pickup)
// @route   PUT /api/kitchen/:id
// @access  Private (Kitchen, Staff)
const updateKitchenTicketStatus = async (req, res, next) => {
    try {
        const { status, chefNotes } = req.body;

        const ticket = await KitchenTicket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: `Kitchen ticket with ID ${req.params.id} not found`
            });
        }

        if (status) ticket.status = status;
        if (chefNotes) ticket.chefNotes = chefNotes;

        await ticket.save();

        // Synchronize with the parent order status if ready for pickup
        if (status === 'ready_for_pickup') {
            await Order.findByIdAndUpdate(ticket.order, { status: 'ready' });
        } else if (status === 'in_progress') {
            await Order.findByIdAndUpdate(ticket.order, { status: 'preparing' });
        }

        res.status(200).json({
            success: true,
            message: `Kitchen ticket status updated to '${ticket.status}'`,
            data: ticket
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getKitchenTickets,
    updateKitchenTicketStatus
};
