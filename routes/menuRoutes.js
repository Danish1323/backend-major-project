// Import Express Router
const express = require('express');
const router = express.Router();

// Import Menu Controller
const {
    getMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
} = require('../controllers/menuController');

// Import authentication and role-based authorization middlewares
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get all menus (Public) | Add new menu item (Staff, Manager, Admin)
router.route('/')
    .get(getMenus)
    .post(protect, authorizeRoles('staff', 'manager', 'admin'), createMenu);

// Route: Get single menu item | Update menu item | Delete menu item
router.route('/:id')
    .get(getMenuById)
    .put(protect, authorizeRoles('staff', 'manager', 'admin'), updateMenu)
    .delete(protect, authorizeRoles('staff', 'manager', 'admin'), deleteMenu);

module.exports = router;
