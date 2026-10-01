const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getSavedReports,
    getSavedReportById,
    createSavedReport,
    updateSavedReport,
    deleteSavedReport,
    toggleFavorite,
    toggleArchive,
    duplicateReport,
    shareReport,
    recordReportRun,
    getSavedReportStats,
    getFavoriteReports,
    getRecentReports,
    getSharedWithMe,
    getTemplates,
    bulkDeleteReports,
    bulkArchiveReports
} = require('../controllers/savedReportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/saved-reports
router.get('/', protect, getSavedReports);

// @route   GET /api/saved-reports/stats
router.get('/stats', protect, getSavedReportStats);

// @route   GET /api/saved-reports/favorites
router.get('/favorites', protect, getFavoriteReports);

// @route   GET /api/saved-reports/recent
router.get('/recent', protect, getRecentReports);

// @route   GET /api/saved-reports/shared-with-me
router.get('/shared-with-me', protect, getSharedWithMe);

// @route   GET /api/saved-reports/templates
router.get('/templates', protect, getTemplates);

// @route   POST /api/saved-reports/bulk-archive
router.patch('/bulk-archive', protect, bulkArchiveReports);

// @route   DELETE /api/saved-reports/bulk
router.delete('/bulk', protect, bulkDeleteReports);

// @route   GET /api/saved-reports/:id
router.get('/:id', protect, getSavedReportById);

// @route   POST /api/saved-reports
router.post(
    '/',
    protect,
    [
        body('name')
            .notEmpty().withMessage('Report name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
            .trim(),
        body('reportCategory')
            .notEmpty().withMessage('Report category is required')
            .isIn(['attendance', 'employee', 'leave', 'loan', 'payslip', 'project', 'recruitment', 'award', 'task', 'financial', 'custom'])
            .withMessage('Invalid report category'),
        body('reportType')
            .notEmpty().withMessage('Report type is required')
    ],
    validateRequest,
    createSavedReport
);

// @route   PUT /api/saved-reports/:id
router.put('/:id', protect, updateSavedReport);

// @route   DELETE /api/saved-reports/:id
router.delete('/:id', protect, deleteSavedReport);

// @route   PATCH /api/saved-reports/:id/favorite
router.patch('/:id/favorite', protect, toggleFavorite);

// @route   PATCH /api/saved-reports/:id/archive
router.patch('/:id/archive', protect, toggleArchive);

// @route   POST /api/saved-reports/:id/duplicate
router.post('/:id/duplicate', protect, duplicateReport);

// @route   POST /api/saved-reports/:id/share
router.post('/:id/share', protect, shareReport);

// @route   POST /api/saved-reports/:id/run
router.post('/:id/run', protect, recordReportRun);

module.exports = router;