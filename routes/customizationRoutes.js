// Import Express Router
const express = require('express');
const router = express.Router();

// Import Customization Handlers from menuController
const {
    addCustomization,
    getCustomizations
} = require('../controllers/menuController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get all customizations | Add a new customization option
router.route('/')
    .get(getCustomizations)
    .post(protect, authorizeRoles('staff', 'manager', 'admin'), addCustomization);

module.exports = router;
