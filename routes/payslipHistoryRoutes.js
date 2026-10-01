const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getPayslipHistory,
    getHistoryByPayslip,
    getHistoryByEmployee,
    getHistoryByAction,
    getHistoryStats,
    getPayslipTimeline,
    getRecentActivity,
    getMyActivity,
    getAuditSummary,
    cleanupOldHistory
} = require('../controllers/payslipHistoryController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/payslip-history
// @desc    Get all payslip history with filters
// @access  Private
router.get('/', protect, getPayslipHistory);

// @route   GET /api/payslip-history/stats
// @desc    Get history statistics
// @access  Private
router.get('/stats', protect, getHistoryStats);

// @route   GET /api/payslip-history/recent
// @desc    Get recent activity feed
// @access  Private
router.get('/recent', protect, getRecentActivity);

// @route   GET /api/payslip-history/my-activity
// @desc    Get current user's activity
// @access  Private
router.get('/my-activity', protect, getMyActivity);

// @route   GET /api/payslip-history/audit-summary
// @desc    Get audit trail summary
// @access  Private (Admin only)
router.get('/audit-summary', protect, authorize('admin', 'super_admin'), getAuditSummary);

// @route   GET /api/payslip-history/payslip/:payslipId
// @desc    Get history for specific payslip
// @access  Private
router.get('/payslip/:payslipId', protect, getHistoryByPayslip);

// @route   GET /api/payslip-history/timeline/:payslipId
// @desc    Get timeline for specific payslip
// @access  Private
router.get('/timeline/:payslipId', protect, getPayslipTimeline);

// @route   GET /api/payslip-history/employee/:employeeId
// @desc    Get history for specific employee
// @access  Private
router.get('/employee/:employeeId', protect, getHistoryByEmployee);

// @route   GET /api/payslip-history/action/:action
// @desc    Get history by action type
// @access  Private
router.get('/action/:action', protect, getHistoryByAction);

// @route   DELETE /api/payslip-history/cleanup
// @desc    Delete old history records
// @access  Private (Super Admin only)
router.delete(
    '/cleanup',
    protect,
    authorize('super_admin'),
    [
        body('daysToKeep')
            .optional()
            .isInt({ min: 30 }).withMessage('Days to keep must be at least 30')
    ],
    validateRequest,
    cleanupOldHistory
);

module.exports = router;