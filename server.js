// Load environment variables from .env file at the very start
const dotenv = require('dotenv');
dotenv.config();

// Import built-in Node.js HTTP module
const http = require('http');

// Import Express framework
const express = require('express');

// Import third-party middlewares
const cors = require('cors');
const morgan = require('morgan');

// Import Socket.io Server class
const { Server } = require('socket.io');

// Import database connection configuration
const connectDB = require('./config/db');

// Import Socket.io event initialization helper
const { initializeSocket } = require('./utils/socketEvents');

// Import error handling middlewares
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const customizationRoutes = require('./routes/customizationRoutes');
const tableRoutes = require('./routes/tableRoutes');
const qrRoutes = require('./routes/qrRoutes');
const orderRoutes = require('./routes/orderRoutes');
const splitBillRoutes = require('./routes/splitBillRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// 1. Connect to MongoDB
connectDB();

// 2. Initialize Express application
const app = express();

// 3. Create HTTP server wrapping Express app (necessary for Socket.io integration)
const server = http.createServer(app);

// 4. Initialize Socket.io on the HTTP server with CORS enabled
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for student development and testing
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Pass Socket.io instance to our socket events manager
initializeSocket(io);

// 5. Mount Standard Express Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Built-in middleware to parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Log HTTP requests to the terminal in colored dev format
app.use(express.static('public')); // Serve static frontend files from 'public' directory

// 6. Base API Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'MenuDirect API is healthy and operational',
        timestamp: new Date().toISOString()
    });
});

// 7. Mount Application Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/customizations', customizationRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/split-bill', splitBillRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// 8. Mount Centralized Error Handling Middlewares (MUST be after routes)
app.use(notFound); // Handles non-existent 404 routes
app.use(errorHandler); // Catches and formats all internal errors

// 9. Start Server Listening on designated PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 MenuDirect Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`🌐 Server Port: http://localhost:${PORT}`);
    console.log(`📱 Live Interactive Demo: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io WebSocket service ready`);
    console.log(`=================================================`);
});
