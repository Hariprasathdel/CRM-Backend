const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    getLeaveBalances,
    getEmployeeBalance,
    getMyBalance,
    createOrUpdateBalance,
    updateBalance,
    adjustBalance,
    deleteBalance,
    initializeYear,
    processCarryForward,
    getDepartmentSummary,
    getStats
} = require('../controllers/leaveBalanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/leave-balances
router.get('/', protect, getLeaveBalances);

// @route   GET /api/leave-balances/stats
router.get('/stats', protect, getStats);

// @route   GET /api/leave-balances/department-summary
router.get('/department-summary', protect, getDepartmentSummary);

// @route   GET /api/leave-balances/my-balance
router.get('/my-balance', protect, getMyBalance);

// @route   GET /api/leave-balances/employee/:employeeId
router.get('/employee/:employeeId', protect, getEmployeeBalance);

// @route   POST /api/leave-balances
router.post(
    '/',
    protect,
    authorize('admin', 'super_admin'),
    [
        body('employeeId').notEmpty().isMongoId(),
        body('year').isInt({ min: 2000, max: 2100 })
    ],
    validateRequest,
    createOrUpdateBalance
);

// @route   POST /api/leave-balances/initialize-year
router.post(
    '/initialize-year',
    protect,
    authorize('admin', 'super_admin'),
    initializeYear
);

// @route   POST /api/leave-balances/carry-forward
router.post(
    '/carry-forward',
    protect,
    authorize('admin', 'super_admin'),
    processCarryForward
);

// @route   PUT /api/leave-balances/:id
router.put('/:id', protect, authorize('admin', 'super_admin'), updateBalance);

// @route   PATCH /api/leave-balances/:id/adjust
router.patch('/:id/adjust', protect, authorize('admin', 'super_admin'), adjustBalance);

// @route   DELETE /api/leave-balances/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteBalance);

module.exports = router;