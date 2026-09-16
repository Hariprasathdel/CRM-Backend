const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getPayslips,
    getPayslipById,
    createPayslip,
    updatePayslip,
    deletePayslip,
    generatePayslip,
    getPayslipStats
} = require('../controllers/payslipController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/payslips
// @desc    Get all payslips
// @access  Private
router.get('/', protect, getPayslips);

// @route   GET /api/payslips/stats or /api/payslips/statistics
// @desc    Get payslip statistics
// @access  Private
router.get('/stats', protect, getPayslipStats);
router.get('/statistics', protect, getPayslipStats);

// @route   GET /api/payslips/:id
// @desc    Get payslip by ID
// @access  Private
router.get('/:id', protect, getPayslipById);

// @route   POST /api/payslips
// @desc    Create payslip
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('payPeriod.month')
            .notEmpty().withMessage('Month is required')
            .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        body('payPeriod.year')
            .notEmpty().withMessage('Year is required')
            .isInt({ min: 2000 }).withMessage('Year must be valid')
    ],
    validateRequest,
    createPayslip
);

// @route   POST /api/payslips/generate
// @desc    Generate payslip for employee
// @access  Private (Admin only)
router.post(
    '/generate',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('month')
            .notEmpty().withMessage('Month is required')
            .isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
        body('year')
            .notEmpty().withMessage('Year is required')
            .isInt({ min: 2000 }).withMessage('Year must be valid')
    ],
    validateRequest,
    generatePayslip
);

// @route   PUT /api/payslips/:id
// @desc    Update payslip
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    updatePayslip
);

// @route   DELETE /api/payslips/:id
// @desc    Delete payslip
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deletePayslip
);

module.exports = router;