const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', protect, getProjects);

// @route   GET /api/projects/stats or /api/projects/statistics
// @desc    Get project statistics
// @access  Private
router.get('/stats', protect, getProjectStats);
router.get('/statistics', protect, getProjectStats);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', protect, getProjectById);

// @route   POST /api/projects
// @desc    Create project
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('name')
            .notEmpty().withMessage('Project name is required')
            .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters')
            .trim(),
        body('department')
            .notEmpty().withMessage('Department is required')
            .trim(),
        body('startDate')
            .notEmpty().withMessage('Start date is required')
            .isISO8601().withMessage('Invalid date format'),
        body('endDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (value && new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('status')
            .optional()
            .isIn(['planning', 'ongoing', 'completed', 'on_hold', 'cancelled'])
            .withMessage('Invalid status'),
        body('progress')
            .optional()
            .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
    ],
    validateRequest,
    createProject
);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('name')
            .optional()
            .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters')
            .trim(),
        body('department')
            .optional()
            .trim(),
        body('startDate')
            .optional()
            .isISO8601().withMessage('Invalid date format'),
        body('endDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (req.body.startDate && value && new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            }),
        body('status')
            .optional()
            .isIn(['planning', 'ongoing', 'completed', 'on_hold', 'cancelled'])
            .withMessage('Invalid status'),
        body('progress')
            .optional()
            .isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority')
    ],
    validateRequest,
    updateProject
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteProject
);

module.exports = router;