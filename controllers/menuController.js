// Import MenuItem model
const MenuItem = require('../models/MenuItem');

// @desc    Get all menu items (with optional category filtering)
// @route   GET /api/menus
// @access  Public
const getMenus = async (req, res, next) => {
    try {
        const { category, isAvailable } = req.query;

        // Build query object based on query parameters
        let query = {};
        if (category) {
            query.category = category;
        }
        if (isAvailable !== undefined) {
            query.isAvailable = isAvailable === 'true';
        }

        // Fetch menu items from MongoDB sorted by category and name
        const menus = await MenuItem.find(query).sort({ category: 1, name: 1 });

        res.status(200).json({
            success: true,
            count: menus.length,
            data: menus
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single menu item by ID
// @route   GET /api/menus/:id
// @access  Public
const getMenuById = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: `Menu item with id ${req.params.id} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new menu item
// @route   POST /api/menus
// @access  Private (Staff, Manager, Admin)
const createMenu = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            category,
            imageUrl,
            customizations,
            preparationTimeMinutes
        } = req.body;

        // Create new menu item in MongoDB
        const menuItem = await MenuItem.create({
            name,
            description,
            price,
            category,
            imageUrl,
            customizations: customizations || [],
            preparationTimeMinutes: preparationTimeMinutes || 15
        });

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update an existing menu item
// @route   PUT /api/menus/:id
// @access  Private (Staff, Manager, Admin)
const updateMenu = async (req, res, next) => {
    try {
        let menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: `Menu item with id ${req.params.id} not found`
            });
        }

        // Update fields and run schema validators
        menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Menu item updated successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/menus/:id
// @access  Private (Staff, Manager, Admin)
const deleteMenu = async (req, res, next) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: `Menu item with id ${req.params.id} not found`
            });
        }

        await menuItem.deleteOne();

        res.status(200).json({
            success: true,
            message: `Menu item '${menuItem.name}' removed successfully`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add customization options to a menu item
// @route   POST /api/customizations
// @access  Private (Staff, Manager, Admin)
const addCustomization = async (req, res, next) => {
    try {
        const { menuItemId, name, additionalPrice } = req.body;

        const menuItem = await MenuItem.findById(menuItemId);
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        menuItem.customizations.push({
            name,
            additionalPrice: Number(additionalPrice) || 0
        });

        await menuItem.save();

        res.status(201).json({
            success: true,
            message: 'Customization option added successfully',
            data: menuItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all available customizations across menu items
// @route   GET /api/customizations
// @access  Public
const getCustomizations = async (req, res, next) => {
    try {
        const items = await MenuItem.find({ 'customizations.0': { $exists: true } });
        
        let allCustomizations = [];
        items.forEach(item => {
            item.customizations.forEach(cust => {
                allCustomizations.push({
                    menuItemId: item._id,
                    dishName: item.name,
                    customization: cust
                });
            });
        });

        res.status(200).json({
            success: true,
            count: allCustomizations.length,
            data: allCustomizations
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu,
    addCustomization,
    getCustomizations
};
