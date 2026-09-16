const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats
} = require('../controllers/employeeController');
const { protect, authorize, isAdmin } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private
router.get('/', protect, getEmployees);

// @route   GET /api/employees/stats or /api/employees/statistics
// @desc    Get employee statistics
// @access  Private
router.get('/stats', protect, getEmployeeStats);
router.get('/statistics', protect, getEmployeeStats);

// @route   GET /api/employees/:id
// @desc    Get single employee
// @access  Private
router.get('/:id', protect, getEmployeeById);

// @route   POST /api/employees
// @desc    Create new employee
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('name')
            .notEmpty().withMessage('Name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
            .trim(),
        body('email')
            .isEmail().withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('phone')
            .notEmpty().withMessage('Phone number is required')
            .isMobilePhone().withMessage('Please provide a valid phone number'),
        body('department')
            .notEmpty().withMessage('Department is required')
            .trim(),
        body('position')
            .notEmpty().withMessage('Position is required')
            .trim(),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'on_leave']).withMessage('Invalid status'),
        body('joinDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ],
    validateRequest,
    createEmployee
);

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('name')
            .optional()
            .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
            .trim(),
        body('email')
            .optional()
            .isEmail().withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('phone')
            .optional()
            .isMobilePhone().withMessage('Please provide a valid phone number'),
        body('department')
            .optional()
            .trim(),
        body('position')
            .optional()
            .trim(),
        body('status')
            .optional()
            .isIn(['active', 'inactive', 'on_leave']).withMessage('Invalid status'),
        body('joinDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ],
    validateRequest,
    updateEmployee
);

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteEmployee
);

module.exports = router;