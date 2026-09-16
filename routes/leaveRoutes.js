const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getLeaves,
    getLeaveById,
    createLeave,
    updateLeave,
    deleteLeave,
    approveLeave,
    rejectLeave,
    getLeaveStats
} = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/leaves
// @desc    Get all leave requests
// @access  Private
router.get('/', protect, getLeaves);

// @route   GET /api/leaves/stats or /api/leaves/statistics
// @desc    Get leave statistics
// @access  Private
router.get('/stats', protect, getLeaveStats);
router.get('/statistics', protect, getLeaveStats);

// @route   GET /api/leaves/:id
// @desc    Get leave request by ID
// @access  Private
router.get('/:id', protect, getLeaveById);

// @route   POST /api/leaves
// @desc    Create leave request
// @access  Private
router.post(
    '/',
    protect,
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('reason')
            .notEmpty().withMessage('Reason is required')
            .trim()
            .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters'),
        body('type')
            .notEmpty().withMessage('Leave type is required')
            .isIn(['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'other'])
            .withMessage('Invalid leave type'),
        body('startDate')
            .notEmpty().withMessage('Start date is required')
            .isISO8601().withMessage('Invalid date format'),
        body('endDate')
            .notEmpty().withMessage('End date is required')
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],
    validateRequest,
    createLeave
);

// @route   PUT /api/leaves/:id
// @desc    Update leave request
// @access  Private
router.put(
    '/:id',
    protect,
    [
        body('reason')
            .optional()
            .trim()
            .isLength({ min: 3, max: 500 }).withMessage('Reason must be between 3 and 500 characters'),
        body('type')
            .optional()
            .isIn(['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'other'])
            .withMessage('Invalid leave type'),
        body('startDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('endDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],
    validateRequest,
    updateLeave
);

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private (Admin only)
router.put(
    '/:id/approve',
    protect,
    authorize('admin', 'super_admin'),
    approveLeave
);

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private (Admin only)
router.put(
    '/:id/reject',
    protect,
    authorize('admin', 'super_admin'),
    rejectLeave
);

// @route   DELETE /api/leaves/:id
// @desc    Delete leave request
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteLeave
);

module.exports = router;