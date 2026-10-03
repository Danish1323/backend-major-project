// Database Seeder Script - Populates MongoDB with initial test data
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Inventory = require('../models/Inventory');
const { generateTableQRCode } = require('./qrGenerator');

const seedData = async () => {
    try {
        console.log(`Connecting to MongoDB at: ${process.env.MONGO_URI}...`);
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('Connected to MongoDB for database seeding...');

        // 1. Clear existing data
        await User.deleteMany();
        await MenuItem.deleteMany();
        await Table.deleteMany();
        await Inventory.deleteMany();
        console.log('Cleared existing collections.');

        // 2. Create Default Users (Password for all: 'password123')
        const users = await User.create([
            {
                name: 'Restaurant Manager',
                email: 'manager@menudirect.com',
                password: 'password123',
                role: 'manager'
            },
            {
                name: 'Floor Staff / Waiter',
                email: 'staff@menudirect.com',
                password: 'password123',
                role: 'staff'
            },
            {
                name: 'Head Chef',
                email: 'chef@menudirect.com',
                password: 'password123',
                role: 'kitchen'
            },
            {
                name: 'Test Customer',
                email: 'customer@menudirect.com',
                password: 'password123',
                role: 'customer'
            }
        ]);
        console.log(`Created ${users.length} sample users.`);

        // 3. Create Sample Menu Items (Matching Case Study: Paneer Tikka, Lemonade, Biryani, etc.)
        const menuItems = await MenuItem.create([
            {
                name: 'Custom Paneer Tikka',
                description: 'Char-grilled cottage cheese marinated in spiced yogurt and herbs',
                price: 350,
                category: 'Starters',
                imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500',
                isAvailable: true,
                preparationTimeMinutes: 15,
                ordersCount: 18,
                customizations: [
                    { name: 'Extra Mint Chutney', additionalPrice: 20 },
                    { name: 'Extra Spicy', additionalPrice: 0 },
                    { name: 'Cheese Topping', additionalPrice: 50 }
                ]
            },
            {
                name: 'Hyderabadi Dum Biryani',
                description: 'Fragrant basmati rice layered with rich spices and slow-cooked in dum style',
                price: 450,
                category: 'Main Course',
                imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
                isAvailable: true,
                preparationTimeMinutes: 20,
                ordersCount: 42,
                customizations: [
                    { name: 'Extra Raita', additionalPrice: 30 },
                    { name: 'Double Masala', additionalPrice: 40 }
                ]
            },
            {
                name: 'Fresh Mint Lemonade',
                description: 'Chilled freshly squeezed lemon juice with mint leaves and rock salt',
                price: 120,
                category: 'Beverages',
                imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500',
                isAvailable: true,
                preparationTimeMinutes: 5,
                ordersCount: 30,
                customizations: [
                    { name: 'Sugar Free', additionalPrice: 0 },
                    { name: 'Soda Base', additionalPrice: 20 }
                ]
            },
            {
                name: 'Garlic Butter Naan',
                description: 'Tandoor-baked flatbread brushed with fresh garlic and melted butter',
                price: 80,
                category: 'Breads',
                imageUrl: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=500',
                isAvailable: true,
                preparationTimeMinutes: 10,
                ordersCount: 55,
                customizations: [
                    { name: 'Extra Butter', additionalPrice: 15 }
                ]
            },
            {
                name: 'Warm Gulab Jamun (2 pcs)',
                description: 'Soft milk solids dumplings soaked in cardamom flavored sugar syrup',
                price: 150,
                category: 'Desserts',
                imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
                isAvailable: true,
                preparationTimeMinutes: 5,
                ordersCount: 24,
                customizations: [
                    { name: 'Add Vanilla Ice Cream', additionalPrice: 40 }
                ]
            }
        ]);
        console.log(`Created ${menuItems.length} menu items.`);

        // 4. Create Tables 1 to 6 with Auto-generated QR Codes
        for (let i = 1; i <= 6; i++) {
            const qrCodeUrl = await generateTableQRCode(i);
            await Table.create({
                tableNumber: i,
                capacity: i <= 2 ? 2 : (i <= 4 ? 4 : 6),
                status: 'available',
                qrCodeUrl
            });
        }
        console.log('Created 6 restaurant tables with QR codes.');

        // 5. Create Inventory Raw Materials
        await Inventory.create([
            { itemName: 'Fresh Cottage Cheese (Paneer)', category: 'Dairy', currentStock: 25, unit: 'kg', minThreshold: 5 },
            { itemName: 'Basmati Rice', category: 'Grains & Spices', currentStock: 50, unit: 'kg', minThreshold: 10 },
            { itemName: 'Fresh Lemons', category: 'Vegetables', currentStock: 80, unit: 'pieces', minThreshold: 20 },
            { itemName: 'Amul Butter', category: 'Dairy', currentStock: 15, unit: 'kg', minThreshold: 3 },
            { itemName: 'Refined Flour (Maida)', category: 'Grains & Spices', currentStock: 30, unit: 'kg', minThreshold: 5 }
        ]);
        console.log('Created initial inventory items.');

        console.log('\n✅ Database seeded successfully!');
        console.log('----------------------------------------------------');
        console.log('Sample Accounts:');
        console.log('Manager : manager@menudirect.com / password123');
        console.log('Staff   : staff@menudirect.com   / password123');
        console.log('Chef    : chef@menudirect.com    / password123');
        console.log('Customer: customer@menudirect.com/ password123');
        console.log('----------------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
};

seedData();
