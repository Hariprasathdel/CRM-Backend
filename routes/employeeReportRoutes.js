const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getEmployeeReports,
    getEmployeeReportById,
    generateEmployeeReport,
    deleteEmployeeReport,
    getEmployeeSummary,
    getEmployeeTrend,
    getDepartmentDistribution,
    getGenderDistribution,
    getStatusDistribution
} = require('../controllers/employeeReportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/employee-reports
// @desc    Get all employee reports
// @access  Private
router.get('/', protect, getEmployeeReports);

// @route   GET /api/employee-reports/summary
// @desc    Get quick employee summary
// @access  Private
router.get('/summary', protect, getEmployeeSummary);

// @route   GET /api/employee-reports/trend
// @desc    Get employee growth trend
// @access  Private
router.get('/trend', protect, getEmployeeTrend);

// @route   GET /api/employee-reports/department-distribution
// @desc    Get department distribution
// @access  Private
router.get('/department-distribution', protect, getDepartmentDistribution);

// @route   GET /api/employee-reports/gender-distribution
// @desc    Get gender distribution
// @access  Private
router.get('/gender-distribution', protect, getGenderDistribution);

// @route   GET /api/employee-reports/status-distribution
// @desc    Get status distribution
// @access  Private
router.get('/status-distribution', protect, getStatusDistribution);

// @route   GET /api/employee-reports/:id
// @desc    Get single employee report
// @access  Private
router.get('/:id', protect, getEmployeeReportById);

// @route   POST /api/employee-reports/generate
// @desc    Generate employee report
// @access  Private (Admin only)
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
            .isIn(['summary', 'detailed', 'department', 'designation', 'performance', 'attrition', 'custom'])
            .withMessage('Invalid report type'),
        body('department')
            .optional()
            .isString(),
        body('status')
            .optional()
            .isIn(['all', 'active', 'inactive', 'on_leave'])
            .withMessage('Invalid status'),
        body('gender')
            .optional()
            .isIn(['all', 'male', 'female', 'other'])
            .withMessage('Invalid gender')
    ],
    validateRequest,
    generateEmployeeReport
);

// @route   DELETE /api/employee-reports/:id
// @desc    Delete employee report
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteEmployeeReport
);

module.exports = router;