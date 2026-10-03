// Import mongoose to create SplitBill schema and model
const mongoose = require('mongoose');

// Sub-schema for individual participant's share in the split bill
const personShareSchema = new mongoose.Schema({
    personName: {
        type: String,
        required: [true, 'Please provide person name or identifier'],
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Share amount cannot be negative']
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date,
        default: null
    }
});

// Main Split Bill Schema
const splitBillSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Split bill must be linked to an order']
        },
        totalAmount: {
            type: Number,
            required: true
        },
        splitType: {
            type: String,
            enum: ['equal', 'custom'],
            default: 'equal'
        },
        numberOfPeople: {
            type: Number,
            required: [true, 'Please specify number of people splitting'],
            min: [2, 'At least 2 people are required to split a bill']
        },
        shares: [personShareSchema],
        status: {
            type: String,
            enum: ['unpaid', 'partially_paid', 'settled'],
            default: 'unpaid'
        }
    },
    {
        timestamps: true
    }
);

// Create and export SplitBill model
const SplitBill = mongoose.model('SplitBill', splitBillSchema);
module.exports = SplitBill;
