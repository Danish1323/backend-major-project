// Import Express Router
const express = require('express');
const router = express.Router();

// Import Auth Controller methods
const {
    registerUser,
    loginUser,
    getMe
} = require('../controllers/authController');

// Import authentication protection middleware
const { protect } = require('../middleware/authMiddleware');

// Route: Register new user (POST /api/auth/register)
router.post('/register', registerUser);

// Route: User login (POST /api/auth/login)
router.post('/login', loginUser);

// Route: Get current user profile (GET /api/auth/me) - Protected
router.get('/me', protect, getMe);

module.exports = router;
