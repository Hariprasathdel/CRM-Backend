const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    generateAttendanceReport,
    generateEmployeeReport,
    generateLeaveReport,
    generateProjectReport,
    generateFinancialReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/reports
// @desc    Get all reports
// @access  Private
router.get('/', protect, getReports);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', protect, getReportById);

// @route   POST /api/reports
// @desc    Create report
// @access  Private
router.post(
    '/',
    protect,
    [
        body('title')
            .notEmpty().withMessage('Report title is required')
            .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
            .trim(),
        body('type')
            .notEmpty().withMessage('Report type is required')
            .isIn(['attendance', 'employee', 'leave', 'project', 'financial', 'custom'])
            .withMessage('Invalid report type'),
        body('dateRange.start')
            .notEmpty().withMessage('Start date is required')
            .isISO8601().withMessage('Invalid start date'),
        body('dateRange.end')
            .notEmpty().withMessage('End date is required')
            .isISO8601().withMessage('Invalid end date')
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.dateRange.start)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('data')
            .notEmpty().withMessage('Report data is required')
    ],
    validateRequest,
    createReport
);

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put(
    '/:id',
    protect,
    [
        body('title')
            .optional()
            .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
            .trim(),
        body('type')
            .optional()
            .isIn(['attendance', 'employee', 'leave', 'project', 'financial', 'custom'])
            .withMessage('Invalid report type'),
        body('dateRange.start')
            .optional()
            .isISO8601().withMessage('Invalid start date'),
        body('dateRange.end')
            .optional()
            .isISO8601().withMessage('Invalid end date')
            .custom((value, { req }) => {
                if (req.body.dateRange?.start && new Date(value) < new Date(req.body.dateRange.start)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],
    validateRequest,
    updateReport
);

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteReport
);

// ==================== REPORT GENERATION ENDPOINTS ====================

// @route   GET /api/reports/generate/attendance
// @desc    Generate attendance report
// @access  Private
router.get(
    '/generate/attendance',
    protect,
    generateAttendanceReport
);

// @route   GET /api/reports/generate/employee
// @desc    Generate employee report
// @access  Private
router.get(
    '/generate/employee',
    protect,
    generateEmployeeReport
);

// @route   GET /api/reports/generate/leave
// @desc    Generate leave report
// @access  Private
router.get(
    '/generate/leave',
    protect,
    generateLeaveReport
);

// @route   GET /api/reports/generate/project
// @desc    Generate project report
// @access  Private
router.get(
    '/generate/project',
    protect,
    generateProjectReport
);

// @route   GET /api/reports/generate/financial
// @desc    Generate financial report
// @access  Private
router.get(
    '/generate/financial',
    protect,
    generateFinancialReport
);

module.exports = router;