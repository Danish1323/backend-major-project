// Import Order model
const Order = require('../models/Order');

// @desc    Send push notification for order status (Simulating Firebase Cloud Messaging FCM)
// @route   POST /api/notifications/send
// @access  Private (Staff, Manager)
const sendPushNotification = async (req, res, next) => {
    try {
        const { orderId, title, message, fcmToken } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Standard notification payload structured according to Firebase Cloud Messaging (FCM) specs
        const notificationPayload = {
            notification: {
                title: title || `Order #${order.orderNumber} Update!`,
                body: message || `Your order status is now: ${order.status.toUpperCase()}`,
                sound: 'default'
            },
            data: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                status: order.status,
                tableNumber: order.tableNumber.toString(),
                sentAt: new Date().toISOString()
            },
            targetToken: fcmToken || 'simulated_device_fcm_token_xyz987'
        };

        // In a live production setting, this would call admin.messaging().send(notificationPayload)
        console.log('Firebase Push Notification Dispatched:', notificationPayload);

        res.status(200).json({
            success: true,
            message: 'Firebase push notification dispatched successfully',
            deliveryReceipt: {
                messageId: `fcm_msg_${Date.now()}`,
                status: 'delivered',
                payload: notificationPayload
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    sendPushNotification
};
