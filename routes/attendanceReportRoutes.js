const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getAttendanceReports,
    getAttendanceReportById,
    generateAttendanceReport,
    deleteAttendanceReport,
    getAttendanceSummary,
    getAttendanceTrend
} = require('../controllers/attendanceReportController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

router.get('/', protect, getAttendanceReports);
router.get('/summary', protect, getAttendanceSummary);
router.get('/trend', protect, getAttendanceTrend);
router.get('/:id', protect, getAttendanceReportById);

router.post(
    '/generate',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('startDate').notEmpty().withMessage('Start date is required').isISO8601(),
        body('endDate').notEmpty().withMessage('End date is required').isISO8601()
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.startDate)) {
                    throw new Error('End date must be after start date');
                }
                return true;
            })
    ],
    validateRequest,
    generateAttendanceReport
);

router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteAttendanceReport);

module.exports = router;