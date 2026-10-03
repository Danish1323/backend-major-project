// Import Express Router
const express = require('express');
const router = express.Router();

// Import Split Bill Controller
const {
    createSplitBill,
    getSplitBills,
    getSplitBillByOrderId,
    payIndividualShare
} = require('../controllers/splitBillController');

const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route: Create split bill (Public) | Get all split bills (Staff/Manager)
router.route('/')
    .post(createSplitBill)
    .get(protect, authorizeRoles('staff', 'manager', 'admin'), getSplitBills);

// Route: Get split bill by order ID
router.route('/order/:id')
    .get(getSplitBillByOrderId);

// Route: Pay individual participant share
router.route('/:id/pay')
    .put(payIndividualShare);

module.exports = router;
