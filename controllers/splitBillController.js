// Import Models
const SplitBill = require('../models/SplitBill');
const Order = require('../models/Order');

// @desc    Create a split bill for an order (equal or custom shares)
// @route   POST /api/split-bill
// @access  Public (or Authenticated)
const createSplitBill = async (req, res, next) => {
    try {
        const { orderId, splitType, numberOfPeople, customShares } = req.body;

        // 1. Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: `Order with ID ${orderId} not found`
            });
        }

        // 2. Check if a split bill already exists for this order
        const existingSplit = await SplitBill.findOne({ order: orderId });
        if (existingSplit) {
            return res.status(400).json({
                success: false,
                message: 'A split bill already exists for this order',
                data: existingSplit
            });
        }

        const totalAmount = order.totalAmount;
        let shares = [];

        // 3. Handle 'equal' split (e.g. ₹900 split between 2 people = ₹450 each)
        if (!splitType || splitType === 'equal') {
            const count = Number(numberOfPeople) || 2;
            if (count < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'At least 2 people are required to split a bill'
                });
            }

            const shareAmount = Math.round((totalAmount / count) * 100) / 100;

            for (let i = 1; i <= count; i++) {
                shares.push({
                    personName: `Person ${i}`,
                    amount: shareAmount,
                    isPaid: false
                });
            }
        } 
        // 4. Handle 'custom' split
        else if (splitType === 'custom') {
            if (!customShares || !Array.isArray(customShares) || customShares.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Custom split requires an array of shares for at least 2 people'
                });
            }

            // Verify the sum of custom shares matches the total bill
            const sumShares = customShares.reduce((sum, item) => sum + Number(item.amount || 0), 0);
            if (Math.abs(sumShares - totalAmount) > 1) { // Allowing +/- 1 rupee rounding difference
                return res.status(400).json({
                    success: false,
                    message: `Sum of custom shares (₹${sumShares}) does not equal total order amount (₹${totalAmount})`
                });
            }

            shares = customShares.map(item => ({
                personName: item.personName,
                amount: Number(item.amount),
                isPaid: false
            }));
        }

        // 5. Create SplitBill record
        const splitBill = await SplitBill.create({
            order: order._id,
            totalAmount,
            splitType: splitType || 'equal',
            numberOfPeople: shares.length,
            shares,
            status: 'unpaid'
        });

        // 6. Update order's payment status to 'split_pending'
        order.paymentStatus = 'split_pending';
        await order.save();

        res.status(201).json({
            success: true,
            message: `Bill split created for ${shares.length} people (₹${shares[0].amount} each)`,
            data: splitBill
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all split bills
// @route   GET /api/split-bill
// @access  Private (Staff, Manager)
const getSplitBills = async (req, res, next) => {
    try {
        const splitBills = await SplitBill.find().populate('order').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: splitBills.length,
            data: splitBills
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get split bill details for a specific order
// @route   GET /api/split-bill/order/:id
// @access  Public
const getSplitBillByOrderId = async (req, res, next) => {
    try {
        const splitBill = await SplitBill.findOne({ order: req.params.id }).populate('order');

        if (!splitBill) {
            return res.status(404).json({
                success: false,
                message: `No split bill found for Order ID ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: splitBill
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Pay individual share within a split bill
// @route   PUT /api/split-bill/:id/pay
// @access  Public
const payIndividualShare = async (req, res, next) => {
    try {
        const { shareIndex, personName } = req.body;
        const splitBill = await SplitBill.findById(req.params.id);

        if (!splitBill) {
            return res.status(404).json({
                success: false,
                message: 'Split bill not found'
            });
        }

        // Find share by index or person name
        let targetShare;
        if (shareIndex !== undefined && splitBill.shares[shareIndex]) {
            targetShare = splitBill.shares[shareIndex];
        } else if (personName) {
            targetShare = splitBill.shares.find(s => s.personName.toLowerCase() === personName.toLowerCase());
        }

        if (!targetShare) {
            return res.status(404).json({
                success: false,
                message: 'Share not found in this split bill'
            });
        }

        // Mark share as paid
        targetShare.isPaid = true;
        targetShare.paidAt = new Date();

        // Check if all shares are now paid
        const allPaid = splitBill.shares.every(s => s.isPaid === true);
        const anyPaid = splitBill.shares.some(s => s.isPaid === true);

        if (allPaid) {
            splitBill.status = 'settled';
            // Mark the underlying order as paid too!
            await Order.findByIdAndUpdate(splitBill.order, { paymentStatus: 'paid', status: 'paid' });
        } else if (anyPaid) {
            splitBill.status = 'partially_paid';
        }

        await splitBill.save();

        res.status(200).json({
            success: true,
            message: `Payment received for ${targetShare.personName} (₹${targetShare.amount})`,
            data: splitBill
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createSplitBill,
    getSplitBills,
    getSplitBillByOrderId,
    payIndividualShare
};
