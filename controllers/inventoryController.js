// Import Inventory model
const Inventory = require('../models/Inventory');

// @desc    Get all inventory stock items
// @route   GET /api/inventory
// @access  Private (Staff, Kitchen, Manager)
const getInventory = async (req, res, next) => {
    try {
        const { status, category } = req.query;

        let query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        const inventory = await Inventory.find(query).sort({ status: -1, itemName: 1 });

        res.status(200).json({
            success: true,
            count: inventory.length,
            data: inventory
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a new raw material to inventory
// @route   POST /api/inventory
// @access  Private (Staff, Manager)
const createInventoryItem = async (req, res, next) => {
    try {
        const { itemName, category, currentStock, unit, minThreshold } = req.body;

        const existing = await Inventory.findOne({ itemName });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Inventory item '${itemName}' already exists`
            });
        }

        const item = await Inventory.create({
            itemName,
            category,
            currentStock: Number(currentStock) || 0,
            unit: unit || 'kg',
            minThreshold: Number(minThreshold) || 5
        });

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update stock quantity or threshold of an inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Staff, Manager)
const updateInventoryStock = async (req, res, next) => {
    try {
        const { currentStock, minThreshold, restockQuantity } = req.body;

        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: `Inventory item with ID ${req.params.id} not found`
            });
        }

        // Support adding to existing stock via restockQuantity or setting directly
        if (restockQuantity !== undefined) {
            item.currentStock += Number(restockQuantity);
        } else if (currentStock !== undefined) {
            item.currentStock = Number(currentStock);
        }

        if (minThreshold !== undefined) {
            item.minThreshold = Number(minThreshold);
        }

        // Save triggers the pre-save hook to re-evaluate 'low_stock' / 'in_stock'
        await item.save();

        res.status(200).json({
            success: true,
            message: `Stock updated for ${item.itemName}`,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Auto-deduct inventory after food preparation (Advanced Feature)
// @route   POST /api/inventory/auto-deduct
// @access  Private (Staff, Kitchen)
const autoDeductInventory = async (req, res, next) => {
    try {
        const { deductions } = req.body; // Array of { itemName, amountDeducted }

        if (!deductions || !Array.isArray(deductions)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of deductions'
            });
        }

        let updatedItems = [];

        for (const deduction of deductions) {
            const item = await Inventory.findOne({ itemName: deduction.itemName });
            if (item) {
                item.currentStock = Math.max(0, item.currentStock - Number(deduction.amountDeducted || 1));
                await item.save();
                updatedItems.push(item);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Inventory auto-deducted successfully',
            data: updatedItems
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    createInventoryItem,
    updateInventoryStock,
    autoDeductInventory
};
