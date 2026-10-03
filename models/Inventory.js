// Import mongoose to create Inventory schema and model
const mongoose = require('mongoose');

// Define Inventory Item Schema
const inventorySchema = new mongoose.Schema(
    {
        itemName: {
            type: String,
            required: [true, 'Please provide inventory item name'],
            unique: true,
            trim: true
        },
        category: {
            type: String,
            enum: ['Dairy', 'Vegetables', 'Meat', 'Grains & Spices', 'Beverages', 'Packaging'],
            default: 'Vegetables'
        },
        currentStock: {
            type: Number,
            required: [true, 'Please provide current stock count'],
            min: [0, 'Stock cannot be negative'],
            default: 0
        },
        unit: {
            type: String,
            required: [true, 'Please provide measurement unit'],
            enum: ['kg', 'grams', 'liters', 'ml', 'pieces', 'packets'],
            default: 'kg'
        },
        minThreshold: {
            type: Number,
            required: [true, 'Please provide minimum threshold for low-stock warning'],
            default: 5
        },
        status: {
            type: String,
            enum: ['in_stock', 'low_stock', 'out_of_stock'],
            default: 'in_stock'
        }
    },
    {
        timestamps: true
    }
);

// Mongoose Pre-save Hook: Automatically updates inventory status based on stock vs threshold
inventorySchema.pre('save', function (next) {
    if (this.currentStock <= 0) {
        this.status = 'out_of_stock';
    } else if (this.currentStock <= this.minThreshold) {
        this.status = 'low_stock';
    } else {
        this.status = 'in_stock';
    }
    next();
});

// Create and export Inventory model
const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
