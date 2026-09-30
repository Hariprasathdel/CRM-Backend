const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getLoanReports,
    getLoanReportById,
    generateLoanReport,
    deleteLoanReport,
    getLoanSummary,
    getLoanTrend,
    getLoanStatusDistribution,
    getTopBorrowers,
    getOverdueLoans
} = require('../controllers/loanReportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/loan-reports
router.get('/', protect, getLoanReports);

// @route   GET /api/loan-reports/summary
router.get('/summary', protect, getLoanSummary);

// @route   GET /api/loan-reports/trend
router.get('/trend', protect, getLoanTrend);

// @route   GET /api/loan-reports/status-distribution
router.get('/status-distribution', protect, getLoanStatusDistribution);

// @route   GET /api/loan-reports/top-borrowers
router.get('/top-borrowers', protect, getTopBorrowers);

// @route   GET /api/loan-reports/overdue
router.get('/overdue', protect, getOverdueLoans);

// @route   GET /api/loan-reports/:id
router.get('/:id', protect, getLoanReportById);

// @route   POST /api/loan-reports/generate
router.post(
    '/generate',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('startDate')
            .notEmpty().withMessage('Start date is required')
            .isISO8601().withMessage('Invalid start date format'),
        body('endDate')
            .notEmpty().withMessage('End date is required')
            .isISO8601().withMessage('Invalid end date format')
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('reportType')
            .optional()
            .isIn(['summary', 'detailed', 'active', 'overdue', 'defaulted', 'paid', 'employee', 'custom'])
            .withMessage('Invalid report type'),
        body('status')
            .optional()
            .isIn(['all', 'active', 'paid', 'defaulted', 'pending'])
            .withMessage('Invalid status')
    ],
    validateRequest,
    generateLoanReport
);

// @route   DELETE /api/loan-reports/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteLoanReport);

module.exports = router;