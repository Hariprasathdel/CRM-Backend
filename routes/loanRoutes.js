const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan,
    getLoanStats
} = require('../controllers/loanController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/loans
// @desc    Get all loans
// @access  Private
router.get('/', protect, getLoans);

// @route   GET /api/loans/stats
// @desc    Get loan statistics
// @access  Private
router.get('/stats', protect, getLoanStats);

// @route   GET /api/loans/:id
// @desc    Get loan by ID
// @access  Private
router.get('/:id', protect, getLoanById);

// @route   POST /api/loans
// @desc    Create loan
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('amount')
            .notEmpty().withMessage('Loan amount is required')
            .isFloat({ min: 0 }).withMessage('Amount must be positive'),
        body('interestRate')
            .notEmpty().withMessage('Interest rate is required')
            .isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
        body('tenure')
            .notEmpty().withMessage('Loan tenure is required')
            .isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
        body('startDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('status')
            .optional()
            .isIn(['active', 'paid', 'defaulted', 'pending']).withMessage('Invalid status'),
        body('monthlyInstallment')
            .optional()
            .isFloat({ min: 0 }).withMessage('Monthly installment must be positive')
    ],
    validateRequest,
    createLoan
);

// @route   PUT /api/loans/:id
// @desc    Update loan
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('amount')
            .optional()
            .isFloat({ min: 0 }).withMessage('Amount must be positive'),
        body('interestRate')
            .optional()
            .isFloat({ min: 0, max: 100 }).withMessage('Interest rate must be between 0 and 100'),
        body('tenure')
            .optional()
            .isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
        body('startDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('status')
            .optional()
            .isIn(['active', 'paid', 'defaulted', 'pending']).withMessage('Invalid status'),
        body('monthlyInstallment')
            .optional()
            .isFloat({ min: 0 }).withMessage('Monthly installment must be positive'),
        body('totalPaid')
            .optional()
            .isFloat({ min: 0 }).withMessage('Total paid must be positive')
    ],
    validateRequest,
    updateLoan
);

// @route   DELETE /api/loans/:id
// @desc    Delete loan
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteLoan
);

module.exports = router;