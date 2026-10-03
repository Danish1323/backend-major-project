// Import mongoose to create KitchenTicket schema and model
const mongoose = require('mongoose');

// Define KitchenTicket Schema
const kitchenTicketSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Kitchen ticket must be linked to an order']
        },
        orderNumber: {
            type: String,
            required: true
        },
        tableNumber: {
            type: Number,
            required: true
        },
        items: [
            {
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                customizations: [String],
                itemNotes: { type: String, default: '' }
            }
        ],
        status: {
            type: String,
            enum: ['received', 'in_progress', 'ready_for_pickup', 'served'],
            default: 'received'
        },
        priority: {
            type: String,
            enum: ['normal', 'rush'],
            default: 'normal'
        },
        station: {
            type: String,
            enum: ['grill', 'curry', 'bakery', 'beverages', 'general'],
            default: 'general'
        }
    },
    {
        timestamps: true
    }
);

// Create and export KitchenTicket model
const KitchenTicket = mongoose.model('KitchenTicket', kitchenTicketSchema);
module.exports = KitchenTicket;
