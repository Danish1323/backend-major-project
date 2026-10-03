// Import Express Router
const express = require('express');
const router = express.Router();

// Import Notification Controller
const { sendPushNotification } = require('../controllers/notificationController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Send push notification for order status (Staff, Manager)
router.post('/send', protect, authorizeRoles('staff', 'kitchen', 'manager', 'admin'), sendPushNotification);

module.exports = router;
