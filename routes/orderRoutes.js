// Import Express Router
const express = require('express');
const router = express.Router();

// Import Order Controller
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus
} = require('../controllers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Place order (Public for table guest QR scans or authenticated users) | List orders (Staff/Manager)
router.route('/')
    .post(createOrder)
    .get(protect, authorizeRoles('staff', 'kitchen', 'manager', 'admin'), getOrders);

// Route: Get order details by ID
router.route('/:id')
    .get(getOrderById);

// Route: Update order status (Staff, Kitchen, Manager, Admin)
router.route('/:id/status')
    .put(protect, authorizeRoles('staff', 'kitchen', 'manager', 'admin'), updateOrderStatus);

module.exports = router;
