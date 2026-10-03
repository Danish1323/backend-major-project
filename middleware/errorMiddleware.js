// 404 Not Found Middleware - Handles requests to routes that do not exist
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Passes the 404 error to the global errorHandler middleware
};

// Global Error Handler Middleware - Catches all thrown errors in the application
const errorHandler = (err, req, res, next) => {
    // If response status code is 200 OK, default to 500 Internal Server Error
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // In development mode, display stack trace for easy debugging; hide in production
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { notFound, errorHandler };
