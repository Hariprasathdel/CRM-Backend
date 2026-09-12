const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAwards,
    getAwardById,
    createAward,
    updateAward,
    deleteAward,
    getAwardStats
} = require('../controllers/awardController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/awards
// @desc    Get all awards
// @access  Private
router.get('/', protect, getAwards);

// @route   GET /api/awards/stats
// @desc    Get award statistics
// @access  Private
router.get('/stats', protect, getAwardStats);

// @route   GET /api/awards/:id
// @desc    Get award by ID
// @access  Private
router.get('/:id', protect, getAwardById);

// @route   POST /api/awards
// @desc    Create award
// @access  Private (Admin only)
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeId')
            .notEmpty().withMessage('Employee ID is required')
            .isMongoId().withMessage('Invalid employee ID'),
        body('employeeName')
            .notEmpty().withMessage('Employee name is required')
            .trim(),
        body('department')
            .notEmpty().withMessage('Department is required')
            .trim(),
        body('awardName')
            .notEmpty().withMessage('Award name is required')
            .trim(),
        body('type')
            .notEmpty().withMessage('Award type is required')
            .isIn(['gascapitol', 'coby_beach', 'best_employee', 'innovation', 'leadership', 'team_player', 'other'])
            .withMessage('Invalid award type'),
        body('date')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ],
    validateRequest,
    createAward
);

// @route   PUT /api/awards/:id
// @desc    Update award
// @access  Private (Admin only)
router.put(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeName')
            .optional()
            .trim(),
        body('department')
            .optional()
            .trim(),
        body('awardName')
            .optional()
            .trim(),
        body('type')
            .optional()
            .isIn(['gascapitol', 'coby_beach', 'best_employee', 'innovation', 'leadership', 'team_player', 'other'])
            .withMessage('Invalid award type'),
        body('date')
            .optional()
            .isISO8601().withMessage('Invalid date format')
    ],
    validateRequest,
    updateAward
);

// @route   DELETE /api/awards/:id
// @desc    Delete award
// @access  Private (Admin only)
router.delete(
    '/:id',
    protect,
    authorize('admin', 'super_admin'),
    deleteAward
);

module.exports = router;