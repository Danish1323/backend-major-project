// Import mongoose to create Table schema and model
const mongoose = require('mongoose');

// Define Table Schema
const tableSchema = new mongoose.Schema(
    {
        tableNumber: {
            type: Number,
            required: [true, 'Please specify table number'],
            unique: true,
            min: [1, 'Table number must be at least 1']
        },
        capacity: {
            type: Number,
            required: [true, 'Please specify seating capacity'],
            default: 4,
            min: [1, 'Capacity must be at least 1 person']
        },
        status: {
            type: String,
            enum: ['available', 'occupied', 'reserved'],
            default: 'available'
        },
        qrCodeUrl: {
            type: String,
            default: ''
        },
        currentOrder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Create and export Table model
const Table = mongoose.model('Table', tableSchema);
module.exports = Table;
