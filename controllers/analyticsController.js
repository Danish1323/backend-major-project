// Import Models
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @desc    Get top popular menu items by sales volume
// @route   GET /api/analytics/popular
// @access  Private (Manager, Admin)
const getPopularItems = async (req, res, next) => {
    try {
        const limit = Number(req.query.limit) || 5;

        // Fetch top dishes sorted by ordersCount in descending order
        const popularItems = await MenuItem.find()
            .sort({ ordersCount: -1 })
            .limit(limit)
            .select('name category price ordersCount imageUrl');

        res.status(200).json({
            success: true,
            count: popularItems.length,
            message: 'Top performing dishes by order volume',
            data: popularItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get peak ordering hours distribution
// @route   GET /api/analytics/peak-hours
// @access  Private (Manager, Admin)
const getPeakHours = async (req, res, next) => {
    try {
        // Fetch all orders to analyze hourly distribution
        const orders = await Order.find().select('createdAt totalAmount');

        // Initialize hourly frequency array (24 hours: 00:00 to 23:00)
        let hourlyStats = {};
        for (let h = 0; h < 24; h++) {
            const hourLabel = `${h.toString().padStart(2, '0')}:00`;
            hourlyStats[hourLabel] = {
                hour: h,
                ordersCount: 0,
                totalRevenue: 0
            };
        }

        // Aggregate orders by hour
        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const hour = orderDate.getHours();
            const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

            if (hourlyStats[hourLabel]) {
                hourlyStats[hourLabel].ordersCount += 1;
                hourlyStats[hourLabel].totalRevenue += order.totalAmount || 0;
            }
        });

        // Convert object to array and sort to find peak hour
        const hourlyArray = Object.values(hourlyStats);
        const sortedByOrders = [...hourlyArray].sort((a, b) => b.ordersCount - a.ordersCount);
        const peakHour = sortedByOrders[0];

        res.status(200).json({
            success: true,
            peakHour: peakHour.ordersCount > 0 ? `${peakHour.hour}:00 with ${peakHour.ordersCount} orders` : 'No orders recorded yet',
            data: hourlyArray
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPopularItems,
    getPeakHours
};
