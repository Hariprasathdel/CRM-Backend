const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getApplicants,
    getApplicantsByJob,
    getApplicantById,
    createApplicant,
    updateApplicant,
    updateApplicantStatus,
    scheduleInterview,
    updateInterview,
    sendOffer,
    addCommunication,
    deleteApplicant,
    getApplicantStats,
    getApplicantPipeline
} = require('../controllers/applicantController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/applicants
router.get('/', protect, getApplicants);

// @route   GET /api/applicants/stats
router.get('/stats', protect, getApplicantStats);

// @route   GET /api/applicants/pipeline
router.get('/pipeline', protect, getApplicantPipeline);

// @route   GET /api/applicants/job/:jobId
router.get('/job/:jobId', protect, getApplicantsByJob);

// @route   GET /api/applicants/:id
router.get('/:id', protect, getApplicantById);

// @route   POST /api/applicants
router.post(
    '/',
    protect,
    [
        body('jobId').notEmpty().withMessage('Job ID is required').isMongoId().withMessage('Invalid job ID'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').notEmpty().withMessage('Phone is required')
    ],
    validateRequest,
    createApplicant
);

// @route   PUT /api/applicants/:id
router.put('/:id', protect, updateApplicant);

// @route   PATCH /api/applicants/:id/status
router.patch(
    '/:id/status',
    protect,
    [body('status').notEmpty().withMessage('Status is required')],
    validateRequest,
    updateApplicantStatus
);

// @route   POST /api/applicants/:id/interviews
router.post(
    '/:id/interviews',
    protect,
    [
        body('round').notEmpty().withMessage('Interview round is required'),
        body('scheduledDate').notEmpty().withMessage('Scheduled date is required').isISO8601()
    ],
    validateRequest,
    scheduleInterview
);

// @route   PUT /api/applicants/:id/interviews/:interviewId
router.put('/:id/interviews/:interviewId', protect, updateInterview);

// @route   POST /api/applicants/:id/offer
router.post(
    '/:id/offer',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('offeredSalary').notEmpty().withMessage('Offered salary is required').isNumeric(),
        body('joiningDate').notEmpty().withMessage('Joining date is required').isISO8601()
    ],
    validateRequest,
    sendOffer
);

// @route   POST /api/applicants/:id/communications
router.post(
    '/:id/communications',
    protect,
    [
        body('type').notEmpty().withMessage('Communication type is required'),
        body('message').notEmpty().withMessage('Message is required')
    ],
    validateRequest,
    addCommunication
);

// @route   DELETE /api/applicants/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteApplicant);

module.exports = router;