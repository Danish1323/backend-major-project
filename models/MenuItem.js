// Import mongoose to create MenuItem schema and model
const mongoose = require('mongoose');

// Sub-schema for item customizations (e.g. Extra Cheese, Spice Level)
const customizationOptionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customization name is required'], // e.g. "Extra Cheese", "Spicy Level"
        trim: true
    },
    additionalPrice: {
        type: Number,
        default: 0,
        min: 0
    }
});

// Main Menu Item Schema
const menuItemSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please provide dish name'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Please provide dish description'],
            trim: true
        },
        price: {
            type: Number,
            required: [true, 'Please provide dish price'],
            min: [0, 'Price cannot be negative']
        },
        category: {
            type: String,
            required: [true, 'Please specify a category'],
            enum: ['Starters', 'Main Course', 'Breads', 'Desserts', 'Beverages'],
            default: 'Main Course'
        },
        imageUrl: {
            type: String,
            default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        customizations: [customizationOptionSchema], // Array of available customization options
        preparationTimeMinutes: {
            type: Number,
            default: 15
        },
        ordersCount: {
            type: Number,
            default: 0 // Used for analytics (most popular dishes)
        }
    },
    {
        timestamps: true
    }
);

// Create and export MenuItem model
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
