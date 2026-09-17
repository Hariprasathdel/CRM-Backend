const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getRecruitments,
    getRecruitmentById,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
    getRecruitmentStats
} = require('../controllers/recruitmentController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/recruitments
// @desc    Get all recruitments
// @access  Private
router.get('/', protect, getRecruitments);

// @route   GET /api/recruitments/stats or /api/recruitments/statistics
// @desc    Get recruitment statistics
// @access  Private
router.get('/stats', protect, getRecruitmentStats);
router.get('/statistics', protect, getRecruitmentStats);

// @route   GET /api/recruitment/jobs
router.get('/jobs', protect, getRecruitments);
router.get('/jobs/:id', protect, getRecruitmentById);
router.post('/jobs', protect, createRecruitment);
router.put('/jobs/:id', protect, updateRecruitment);
router.delete('/jobs/:id', protect, deleteRecruitment);

// @route   GET /api/recruitments/:id
// @desc    Get recruitment by ID
// @access  Private
router.get('/:id', protect, getRecruitmentById);

// @route   POST /api/recruitments
// @desc    Create recruitment
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('jobTitle')
            .notEmpty().withMessage('Job title is required')
            .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
            .trim(),
        body('department')
            .notEmpty().withMessage('Department is required')
            .trim(),
        body('vacancies')
            .notEmpty().withMessage('Number of vacancies is required')
            .isInt({ min: 1 }).withMessage('Vacancies must be at least 1'),
        body('description')
            .notEmpty().withMessage('Job description is required')
            .trim()
            .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
        body('status')
            .optional()
            .isIn(['open', 'closed', 'on_hold', 'draft']).withMessage('Invalid status'),
        body('employmentType')
            .optional()
            .isIn(['full_time', 'part_time', 'contract', 'internship', 'freelance'])
            .withMessage('Invalid employment type'),
        body('workType')
            .optional()
            .isIn(['remote', 'onsite', 'hybrid']).withMessage('Invalid work type'),
        body('closingDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (value && req.body.postedDate && new Date(value) < new Date(req.body.postedDate)) {
                    throw new Error('Closing date must be after posted date');
                }
                return true;
            })
    ],
    validateRequest,
    createRecruitment
);

// @route   PUT /api/recruitments/:id
// @desc    Update recruitment
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('jobTitle')
            .optional()
            .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters')
            .trim(),
        body('department')
            .optional()
            .trim(),
        body('vacancies')
            .optional()
            .isInt({ min: 1 }).withMessage('Vacancies must be at least 1'),
        body('description')
            .optional()
            .trim()
            .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
        body('status')
            .optional()
            .isIn(['open', 'closed', 'on_hold', 'draft']).withMessage('Invalid status'),
        body('employmentType')
            .optional()
            .isIn(['full_time', 'part_time', 'contract', 'internship', 'freelance'])
            .withMessage('Invalid employment type'),
        body('workType')
            .optional()
            .isIn(['remote', 'onsite', 'hybrid']).withMessage('Invalid work type'),
        body('closingDate')
            .optional()
            .isISO8601().withMessage('Invalid date format')
            .custom((value, { req }) => {
                if (value && req.body.postedDate && new Date(value) < new Date(req.body.postedDate)) {
                    throw new Error('Closing date must be after posted date');
                }
                return true;
            })
    ],
    validateRequest,
    updateRecruitment
);

// @route   DELETE /api/recruitments/:id
// @desc    Delete recruitment
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteRecruitment
);

module.exports = router;