const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getDailyStats,
    getMonthlyReport
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/attendance
// @desc    Get all attendance records
// @access  Private
router.get('/', protect, getAttendance);

// @route   GET /api/attendance/daily-stats
// @desc    Get daily attendance statistics
// @access  Private
router.get('/daily-stats', protect, getDailyStats);

// @route   GET /api/attendance/monthly-report
// @desc    Get monthly attendance report
// @access  Private
router.get('/monthly-report', protect, getMonthlyReport);

// @route   GET /api/attendance/:id
// @desc    Get attendance record by ID
// @access  Private
router.get('/:id', protect, getAttendanceById);

// @route   POST /api/attendance
// @desc    Create attendance record
// @access  Private
router.post(
    '/',
    protect,
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('status')
            .notEmpty().withMessage('Status is required')
            .isIn(['present', 'absent', 'leave', 'abuse']).withMessage('Invalid status'),
        body('date')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('checkIn')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format HH:MM'),
        body('checkOut')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format HH:MM')
    ],
    validateRequest,
    createAttendance
);

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private
router.put(
    '/:id',
    protect,
    [
        body('status')
            .optional()
            .isIn(['present', 'absent', 'leave', 'abuse']).withMessage('Invalid status'),
        body('checkIn')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format HH:MM'),
        body('checkOut')
            .optional()
            .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format HH:MM'),
        body('overtime')
            .optional()
            .isFloat({ min: 0 }).withMessage('Overtime must be a positive number')
    ],
    validateRequest,
    updateAttendance
);

// @route   DELETE /api/attendance/:id
// @desc    Delete attendance record
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteAttendance
);

module.exports = router;