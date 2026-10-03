// Import mongoose package to communicate with MongoDB database
const mongoose = require('mongoose');

// Function to establish connection with MongoDB
const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Connect to MongoDB using the URI from environment variables with 5s timeout
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        // If connection fails, print error message and stop the server process
        console.error(`MongoDB connection error: ${error.message}`);
        process.exit(1); // Exit process with failure code 1
    }
};

// Export the connectDB function so server.js can use it
module.exports = connectDB;
