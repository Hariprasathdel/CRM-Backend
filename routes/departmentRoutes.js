const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', protect, getDepartments);

// @route   GET /api/departments/stats
// @desc    Get department statistics
// @access  Private
router.get('/stats', protect, getDepartmentStats);

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Private
router.get('/:id', protect, getDepartmentById);

// @route   POST /api/departments
// @desc    Create department
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('name')
            .notEmpty().withMessage('Department name is required')
            .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
            .trim(),
        body('code')
            .optional()
            .isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters')
            .trim()
            .toUpperCase(),
        body('head')
            .optional()
            .trim(),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    ],
    validateRequest,
    createDepartment
);

// @route   PUT /api/departments/:id
// @desc    Update department
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
        body('code')
            .optional()
            .isLength({ min: 2, max: 10 }).withMessage('Code must be between 2 and 10 characters')
            .trim()
            .toUpperCase(),
        body('head')
            .optional()
            .trim(),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
    ],
    validateRequest,
    updateDepartment
);

// @route   DELETE /api/departments/:id
// @desc    Delete department
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteDepartment
);

module.exports = router;