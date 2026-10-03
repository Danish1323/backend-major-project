// Import Table model
const Table = require('../models/Table');
// Import MenuItem model to fetch menu when QR code is scanned
const MenuItem = require('../models/MenuItem');
// Import QR code generator helper
const { generateTableQRCode } = require('../utils/qrGenerator');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public
const getTables = async (req, res, next) => {
    try {
        const tables = await Table.find().sort({ tableNumber: 1 }).populate('currentOrder');
        res.status(200).json({
            success: true,
            count: tables.length,
            data: tables
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single table by ID
// @route   GET /api/tables/:id
// @access  Public
const getTableById = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id).populate('currentOrder');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: `Table with ID ${req.params.id} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: table
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new table (and automatically generate its QR code)
// @route   POST /api/tables
// @access  Private (Staff, Manager, Admin)
const createTable = async (req, res, next) => {
    try {
        const { tableNumber, capacity } = req.body;

        if (!tableNumber) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a table number'
            });
        }

        // Check if table number already exists
        const existingTable = await Table.findOne({ tableNumber });
        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: `Table ${tableNumber} already exists`
            });
        }

        // Generate QR code Data URL for this table
        const qrCodeUrl = await generateTableQRCode(tableNumber);

        // Save table record to MongoDB
        const table = await Table.create({
            tableNumber,
            capacity: capacity || 4,
            status: 'available',
            qrCodeUrl
        });

        res.status(201).json({
            success: true,
            message: `Table ${tableNumber} created with QR Code`,
            data: table
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update table details or status
// @route   PUT /api/tables/:id
// @access  Private (Staff, Manager, Admin)
const updateTable = async (req, res, next) => {
    try {
        let table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: `Table with ID ${req.params.id} not found`
            });
        }

        table = await Table.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: 'Table updated successfully',
            data: table
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Scan QR Code for a Table (Returns Table info + Available Menu Items for Ordering)
// @route   GET /api/qr/table/:id
// @access  Public (Scanned by customer camera)
const getTableByQR = async (req, res, next) => {
    try {
        const param = req.params.id;

        // Support searching by MongoDB ObjectId OR Table Number (e.g. /api/qr/table/12)
        let table;
        if (!isNaN(param)) {
            table = await Table.findOne({ tableNumber: Number(param) });
        } else {
            table = await Table.findById(param);
        }

        if (!table) {
            return res.status(404).json({
                success: false,
                message: `Table ${param} not found. Please contact restaurant staff.`
            });
        }

        // Fetch all active menu items for digital ordering
        const menuItems = await MenuItem.find({ isAvailable: true }).sort({ category: 1 });

        res.status(200).json({
            success: true,
            message: `Welcome to Table ${table.tableNumber}!`,
            data: {
                table: {
                    _id: table._id,
                    tableNumber: table.tableNumber,
                    capacity: table.capacity,
                    status: table.status,
                    qrCodeUrl: table.qrCodeUrl
                },
                digitalMenu: menuItems
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getTables,
    getTableById,
    createTable,
    updateTable,
    getTableByQR
};
