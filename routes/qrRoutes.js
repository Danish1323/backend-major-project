// Import Express Router
const express = require('express');
const router = express.Router();

// Import Table Controller getTableByQR handler
const { getTableByQR } = require('../controllers/tableController');

// Route: QR Scan Endpoint (GET /api/qr/table/:id)
// Accessible when customer camera scans table QR code
router.get('/table/:id', getTableByQR);

module.exports = router;
