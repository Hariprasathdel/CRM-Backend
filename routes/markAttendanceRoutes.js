const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    checkIn,
    checkOut,
    getTodayStatus,
    bulkMarkAttendance,
    markAllPresent,
    bulkUpdateStatus,
    getUnmarkedEmployees,
    getTodayOverview,
    resetAttendance,
    markSingleAttendance,
    getEmployeesWithStatus
} = require('../controllers/markAttendanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// ==================== QUICK CHECK-IN/OUT ====================

// @route   POST /api/mark-attendance/check-in
// @desc    Quick check-in for current user
// @access  Private
router.post('/check-in', protect, checkIn);

// @route   POST /api/mark-attendance/check-out
// @desc    Quick check-out for current user
// @access  Private
router.post('/check-out', protect, checkOut);

// @route   GET /api/mark-attendance/today/:employeeId
// @desc    Get today's attendance status for an employee
// @access  Private
router.get('/today/:employeeId', protect, getTodayStatus);

// ==================== SINGLE MARK ====================

// @route   POST /api/mark-attendance/single
// @desc    Mark single employee attendance
// @access  Private
router.post(
    '/single',
    protect,
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('status')
            .notEmpty().withMessage('Status is required')
            .isIn(['present', 'absent', 'leave', 'abuse']).withMessage('Invalid status')
    ],
    validateRequest,
    markSingleAttendance
);

// ==================== BULK OPERATIONS ====================

// @route   POST /api/mark-attendance/bulk
// @desc    Bulk mark attendance for multiple employees
// @access  Private (Admin only)
router.post(
    '/bulk',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('attendanceList')
            .notEmpty().withMessage('Attendance list is required')
            .isArray().withMessage('Attendance list must be an array')
    ],
    validateRequest,
    bulkMarkAttendance
);

// @route   POST /api/mark-attendance/mark-all-present
// @desc    Mark all employees as present (quick action)
// @access  Private (Admin only)
router.post(
    '/mark-all-present',
    protect,
    authorize('admin', 'super_admin'),
    markAllPresent
);

// @route   POST /api/mark-attendance/bulk-status
// @desc    Bulk update status for selected employees
// @access  Private (Admin only)
router.post(
    '/bulk-status',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeIds')
            .notEmpty().withMessage('Employee IDs are required')
            .isArray().withMessage('Employee IDs must be an array'),
        body('status')
            .notEmpty().withMessage('Status is required')
            .isIn(['present', 'absent', 'leave', 'abuse']).withMessage('Invalid status')
    ],
    validateRequest,
    bulkUpdateStatus
);

// ==================== OVERVIEW & ANALYTICS ====================

// @route   GET /api/mark-attendance/overview
// @desc    Get today's attendance overview
// @access  Private
router.get('/overview', protect, getTodayOverview);

// @route   GET /api/mark-attendance/unmarked
// @desc    Get unmarked employees for a date
// @access  Private
router.get('/unmarked', protect, getUnmarkedEmployees);

// @route   GET /api/mark-attendance/employees-with-status
// @desc    Get employees with attendance status for a date
// @access  Private
router.get('/employees-with-status', protect, getEmployeesWithStatus);

// ==================== ADMIN OPERATIONS ====================

// @route   DELETE /api/mark-attendance/reset
// @desc    Reset attendance for a date (undo)
// @access  Private (Admin only)
router.delete(
    '/reset',
    protect,
    authorize('admin', 'super_admin'),
    resetAttendance
);

module.exports = router;