// Import Express Router
const express = require('express');
const router = express.Router();

// Import Table Controller
const {
    getTables,
    getTableById,
    createTable,
    updateTable
} = require('../controllers/tableController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get all tables | Create new table (staff)
router.route('/')
    .get(getTables)
    .post(protect, authorizeRoles('staff', 'manager', 'admin'), createTable);

// Route: Get single table | Update table status/capacity
router.route('/:id')
    .get(getTableById)
    .put(protect, authorizeRoles('staff', 'manager', 'admin'), updateTable);

module.exports = router;
