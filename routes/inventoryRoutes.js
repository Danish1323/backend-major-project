// Import Express Router
const express = require('express');
const router = express.Router();

// Import Inventory Controller
const {
    getInventory,
    createInventoryItem,
    updateInventoryStock,
    autoDeductInventory
} = require('../controllers/inventoryController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get inventory items | Create new inventory item
router.route('/')
    .get(protect, authorizeRoles('staff', 'kitchen', 'manager', 'admin'), getInventory)
    .post(protect, authorizeRoles('staff', 'manager', 'admin'), createInventoryItem);

// Route: Auto-deduct inventory
router.route('/auto-deduct')
    .post(protect, authorizeRoles('staff', 'kitchen', 'manager', 'admin'), autoDeductInventory);

// Route: Update inventory item stock
router.route('/:id')
    .put(protect, authorizeRoles('staff', 'manager', 'admin'), updateInventoryStock);

module.exports = router;
