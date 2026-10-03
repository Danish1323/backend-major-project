// Store global Socket.io instance reference
let ioInstance = null;

// Initialize Socket.io connection handlers and room logic
const initializeSocket = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`Socket.io client connected with ID: ${socket.id}`);

        // Event: Customer or Waiter joins a specific table room
        // Usage: socket.emit('join_table', 12);
        socket.on('join_table', (tableNumber) => {
            const roomName = `table_${tableNumber}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room: ${roomName}`);
            socket.emit('joined_room_confirmation', {
                room: roomName,
                message: `Subscribed to live updates for Table ${tableNumber}`
            });
        });

        // Event: Kitchen staff / Waiters join the master kitchen room
        // Usage: socket.emit('join_kitchen');
        socket.on('join_kitchen', () => {
            socket.join('kitchen_room');
            console.log(`Socket ${socket.id} joined kitchen_room`);
            socket.emit('joined_room_confirmation', {
                room: 'kitchen_room',
                message: 'Subscribed to live kitchen order stream'
            });
        });

        // Handle client disconnection
        socket.on('disconnect', () => {
            console.log(`Socket client disconnected: ${socket.id}`);
        });
    });
};

// Helper function to get the initialized Socket.io instance anywhere in controllers
const getIO = () => {
    if (!ioInstance) {
        throw new Error('Socket.io has not been initialized yet!');
    }
    return ioInstance;
};

// Utility emission functions used inside controllers
// 1. Notify kitchen and table room of a newly placed order
const emitNewOrder = (order) => {
    if (ioInstance) {
        // Emit to kitchen staff
        ioInstance.to('kitchen_room').emit('new_order_received', order);
        // Emit to table room where customers are viewing status
        ioInstance.to(`table_${order.tableNumber}`).emit('order_created', order);
    }
};

// 2. Notify table customers when order status changes (e.g. preparing -> ready)
const emitOrderStatusUpdate = (order) => {
    if (ioInstance) {
        ioInstance.to(`table_${order.tableNumber}`).emit('order_status_updated', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            updatedAt: order.updatedAt
        });
        // Also update kitchen room
        ioInstance.to('kitchen_room').emit('kitchen_order_updated', order);
    }
};

module.exports = {
    initializeSocket,
    getIO,
    emitNewOrder,
    emitOrderStatusUpdate
};
