const express = require('express');
const router = express.Router();
const {
    getReports,
    getReportById,
    getReportStats,
    generateReport,
    createReport,
    updateReport,
    deleteReport,
    downloadReport,
    generateAttendanceReport,
    generateEmployeeReport,
    generateLeaveReport,
    generateProjectReport,
    generateFinancialReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// ==================== STATS & NON-PARAMETRIC ROUTES FIRST ====================

// @route   GET /api/reports
// @desc    Get all reports with pagination/search/type filters
// @access  Private
router.get('/', protect, getReports);

// @route   GET /api/reports/statistics and /api/reports/stats
// @desc    Get report summary counts and distributions
// @access  Private
router.get('/statistics', protect, getReportStats);
router.get('/stats', protect, getReportStats);

// @route   POST /api/reports/generate
// @desc    Generate report from live MongoDB data
// @access  Private
router.post('/generate', protect, generateReport);

// @route   POST /api/reports
// @desc    Create manual or generated report
// @access  Private
router.post('/', protect, generateReport);

// ==================== SPECIFIC GENERATION ENDPOINTS ====================
router.get('/generate/attendance', protect, generateAttendanceReport);
router.get('/generate/employee', protect, generateEmployeeReport);
router.get('/generate/leave', protect, generateLeaveReport);
router.get('/generate/project', protect, generateProjectReport);
router.get('/generate/financial', protect, generateFinancialReport);

// Templates & Scheduled mocks if requested by client
router.get('/templates', protect, (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'attendance', name: 'Monthly Attendance Summary', format: 'PDF' },
            { id: 'performance', name: 'Department Performance Report', format: 'Excel' },
            { id: 'leave', name: 'Leave & Absence Trends', format: 'PDF' },
            { id: 'project', name: 'Project Milestone Status', format: 'PDF' },
            { id: 'financial', name: 'Salary & Loan Allocation', format: 'Excel' }
        ]
    });
});

router.get('/scheduled', protect, (req, res) => {
    res.json({ success: true, data: [] });
});

router.post('/scheduled', protect, (req, res) => {
    res.status(201).json({ success: true, message: 'Scheduled report saved', data: req.body });
});

// ==================== PARAMETERIZED ROUTES (ID) ====================

// @route   GET /api/reports/:id/download
// @desc    Download report as CSV or JSON
// @access  Private
router.get('/:id/download', protect, downloadReport);

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', protect, getReportById);

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', protect, updateReport);

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteReport);

module.exports = router;