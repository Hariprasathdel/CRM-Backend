const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAwardReports,
    getAwardReportById,
    generateAwardReport,
    deleteAwardReport,
    getAwardSummary,
    getAwardTrend,
    getAwardTypeDistribution,
    getTopPerformers,
    getRecentAwards,
    getDepartmentPerformance
} = require('../controllers/awardReportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/award-reports
router.get('/', protect, getAwardReports);

// @route   GET /api/award-reports/summary
router.get('/summary', protect, getAwardSummary);

// @route   GET /api/award-reports/trend
router.get('/trend', protect, getAwardTrend);

// @route   GET /api/award-reports/type-distribution
router.get('/type-distribution', protect, getAwardTypeDistribution);

// @route   GET /api/award-reports/top-performers
router.get('/top-performers', protect, getTopPerformers);

// @route   GET /api/award-reports/recent
router.get('/recent', protect, getRecentAwards);

// @route   GET /api/award-reports/department-performance
router.get('/department-performance', protect, getDepartmentPerformance);

// @route   GET /api/award-reports/:id
router.get('/:id', protect, getAwardReportById);

// @route   POST /api/award-reports/generate
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
            .isIn(['summary', 'detailed', 'department', 'employee', 'monthly', 'yearly', 'category', 'custom'])
            .withMessage('Invalid report type'),
        body('awardType')
            .optional()
            .isIn(['all', 'gascapitol', 'coby_beach', 'best_employee', 'innovation', 'leadership', 'team_player', 'other'])
            .withMessage('Invalid award type')
    ],
    validateRequest,
    generateAwardReport
);

// @route   DELETE /api/award-reports/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAwardReport);

module.exports = router;