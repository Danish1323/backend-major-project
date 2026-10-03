// Import mongoose to create Order schema and model
const mongoose = require('mongoose');

// Sub-schema for individual items within an order
const orderItemSchema = new mongoose.Schema({
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1'],
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    selectedCustomizations: [
        {
            name: String,
            additionalPrice: Number
        }
    ],
    itemNotes: {
        type: String,
        default: '' // e.g. "Less spicy", "No garlic"
    }
});

// Main Order Schema
const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            required: true
        },
        table: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Table',
            required: [true, 'Order must belong to a table']
        },
        tableNumber: {
            type: Number,
            required: true
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null // Can be null if customer ordered via QR without logging in
        },
        customerName: {
            type: String,
            default: 'Guest Customer'
        },
        items: [orderItemSchema],
        subTotal: {
            type: Number,
            required: true,
            default: 0
        },
        tax: {
            type: Number,
            required: true,
            default: 0 // 5% GST standard in restaurant billing
        },
        totalAmount: {
            type: Number,
            required: true,
            default: 0
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'paid', 'cancelled'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'split_pending', 'paid'],
            default: 'unpaid'
        }
    },
    {
        timestamps: true
    }
);

// Create and export Order model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
