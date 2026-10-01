const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getJobPostings,
    getJobPostingById,
    createJobPosting,
    updateJobPosting,
    updateJobStatus,
    deleteJobPosting,
    getJobStats,
    publishJob
} = require('../controllers/jobPostingController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/job-postings
router.get('/', protect, getJobPostings);

// @route   GET /api/job-postings/stats
router.get('/stats', protect, getJobStats);

// @route   GET /api/job-postings/:id
router.get('/:id', protect, getJobPostingById);

// @route   POST /api/job-postings
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('jobTitle')
            .notEmpty().withMessage('Job title is required')
            .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
        body('department')
            .notEmpty().withMessage('Department is required'),
        body('vacancies')
            .notEmpty().withMessage('Vacancies required')
            .isInt({ min: 1 }).withMessage('Vacancies must be at least 1'),
        body('description')
            .notEmpty().withMessage('Description is required')
            .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
    ],
    validateRequest,
    createJobPosting
);

// @route   PUT /api/job-postings/:id
router.put('/:id', protect, authorize('admin', 'super_admin'), updateJobPosting);

// @route   PATCH /api/job-postings/:id/status
router.patch('/:id/status', protect, updateJobStatus);

// @route   POST /api/job-postings/:id/publish
router.post('/:id/publish', protect, authorize('admin', 'super_admin'), publishJob);

// @route   DELETE /api/job-postings/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteJobPosting);

module.exports = router;