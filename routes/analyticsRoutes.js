// Import Express Router
const express = require('express');
const router = express.Router();

// Import Analytics Controller
const {
    getPopularItems,
    getPeakHours
} = require('../controllers/analyticsController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get most popular dishes
router.get('/popular', protect, authorizeRoles('manager', 'admin', 'staff'), getPopularItems);

// Route: Get peak ordering hours
router.get('/peak-hours', protect, authorizeRoles('manager', 'admin', 'staff'), getPeakHours);

module.exports = router;
