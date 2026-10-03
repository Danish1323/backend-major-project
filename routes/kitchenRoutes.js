// Import Express Router
const express = require('express');
const router = express.Router();

// Import Kitchen Controller
const {
    getKitchenTickets,
    updateKitchenTicketStatus
} = require('../controllers/kitchenController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Get active kitchen tickets | Update ticket status
router.route('/')
    .get(protect, authorizeRoles('kitchen', 'staff', 'manager', 'admin'), getKitchenTickets);

router.route('/:id')
    .put(protect, authorizeRoles('kitchen', 'staff', 'manager', 'admin'), updateKitchenTicketStatus);

module.exports = router;
