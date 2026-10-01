const PayslipHistory = require('../models/PayslipHistory');
const Payslip = require('../models/Payslip');
const mongoose = require('mongoose');

// @desc    Get all payslip history (with filters)
// @route   GET /api/payslip-history
// @access  Private
const getPayslipHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            action,
            employeeId,
            payslipId,
            department,
            startDate,
            endDate,
            performedBy,
            search
        } = req.query;

        const query = {};
        if (action) query.action = action;
        if (employeeId) query.employeeId = employeeId;
        if (payslipId) query.payslipId = payslipId;
        if (department) query.department = department;
        if (performedBy) query.performedBy = performedBy;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        if (search) {
            query.$or = [
                { payslipNumber: { $regex: search, $options: 'i' } },
                { employeeName: { $regex: search, $options: 'i' } },
                { employeeCode: { $regex: search, $options: 'i' } }
            ];
        }

        const history = await PayslipHistory.find(query)
            .populate('performedBy', 'name email role')
            .populate('employeeId', 'name email department position profileImage')
            .populate('payslipId', 'payslipNumber netPay')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await PayslipHistory.countDocuments(query);

        res.json({
            success: true,
            data: history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get history for a specific payslip
// @route   GET /api/payslip-history/payslip/:payslipId
// @access  Private
const getHistoryByPayslip = async (req, res) => {
    try {
        const { payslipId } = req.params;

        // Verify payslip exists
        const payslip = await Payslip.findById(payslipId)
            .populate('employeeId', 'name email department position');

        if (!payslip) {
            return res.status(404).json({
                success: false,
                message: 'Payslip not found'
            });
        }

        const history = await PayslipHistory.find({ payslipId })
            .populate('performedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: {
                payslip: {
                    _id: payslip._id,
                    payslipNumber: payslip.payslipNumber,
                    employeeName: payslip.employeeName,
                    payPeriod: payslip.payPeriod,
                    status: payslip.status,
                    netPay: payslip.netPay
                },
                history,
                totalActions: history.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get history for a specific employee
// @route   GET /api/payslip-history/employee/:employeeId
// @access  Private
const getHistoryByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const history = await PayslipHistory.find({ employeeId })
            .populate('performedBy', 'name email role')
            .populate('payslipId', 'payslipNumber netPay status')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await PayslipHistory.countDocuments({ employeeId });

        res.json({
            success: true,
            data: history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get history by action type
// @route   GET /api/payslip-history/action/:action
// @access  Private
const getHistoryByAction = async (req, res) => {
    try {
        const { action } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const history = await PayslipHistory.find({ action })
            .populate('performedBy', 'name email role')
            .populate('payslipId', 'payslipNumber netPay')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await PayslipHistory.countDocuments({ action });

        res.json({
            success: true,
            data: history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get history statistics
// @route   GET /api/payslip-history/stats
// @access  Private
const getHistoryStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateQuery = {};
        if (startDate || endDate) {
            dateQuery.createdAt = {};
            if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateQuery.createdAt.$lte = end;
            }
        }

        const total = await PayslipHistory.countDocuments(dateQuery);

        const actionStats = await PayslipHistory.aggregate([
            { $match: dateQuery },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const userStats = await PayslipHistory.aggregate([
            { $match: dateQuery },
            {
                $group: {
                    _id: '$performedBy',
                    userName: { $first: '$performedByName' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const departmentStats = await PayslipHistory.aggregate([
            { $match: dateQuery },
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Recent activity (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentActivity = await PayslipHistory.countDocuments({
            createdAt: { $gte: yesterday }
        });

        res.json({
            success: true,
            data: {
                total,
                recentActivity,
                actionStats,
                userStats,
                departmentStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get timeline for a payslip
// @route   GET /api/payslip-history/timeline/:payslipId
// @access  Private
const getPayslipTimeline = async (req, res) => {
    try {
        const { payslipId } = req.params;

        const timeline = await PayslipHistory.find({ payslipId })
            .populate('performedBy', 'name email role')
            .sort({ createdAt: 1 });

        // Format timeline entries
        const formattedTimeline = timeline.map(entry => ({
            _id: entry._id,
            action: entry.action,
            actionDescription: entry.actionDescription,
            performedBy: entry.performedByName,
            performedByRole: entry.performedByRole,
            status: {
                from: entry.previousStatus,
                to: entry.newStatus
            },
            notes: entry.notes,
            changes: entry.changes,
            timestamp: entry.createdAt
        }));

        res.json({
            success: true,
            data: formattedTimeline
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get recent activity feed
// @route   GET /api/payslip-history/recent
// @access  Private
const getRecentActivity = async (req, res) => {
    try {
        const { limit = 20 } = req.query;

        const activity = await PayslipHistory.find()
            .populate('performedBy', 'name email role profileImage')
            .populate('employeeId', 'name department profileImage')
            .populate('payslipId', 'payslipNumber netPay')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get history for current user
// @route   GET /api/payslip-history/my-activity
// @access  Private
const getMyActivity = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const history = await PayslipHistory.find({ performedBy: req.user.id })
            .populate('employeeId', 'name department')
            .populate('payslipId', 'payslipNumber netPay')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await PayslipHistory.countDocuments({ performedBy: req.user.id });

        res.json({
            success: true,
            data: history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get audit trail summary
// @route   GET /api/payslip-history/audit-summary
// @access  Private (Admin only)
const getAuditSummary = async (req, res) => {
    try {
        const { year } = req.query;
        const targetYear = year ? parseInt(year) : new Date().getFullYear();

        // Get monthly activity count
        const monthlyActivity = await PayslipHistory.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, 0, 1),
                        $lte: new Date(targetYear, 11, 31, 23, 59, 59)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        action: '$action'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.month': 1 } }
        ]);

        // Get top active users
        const topUsers = await PayslipHistory.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(targetYear, 0, 1),
                        $lte: new Date(targetYear, 11, 31, 23, 59, 59)
                    }
                }
            },
            {
                $group: {
                    _id: '$performedBy',
                    userName: { $first: '$performedByName' },
                    actionCount: { $sum: 1 }
                }
            },
            { $sort: { actionCount: -1 } },
            { $limit: 10 }
        ]);

        // Total actions this year
        const totalActions = await PayslipHistory.countDocuments({
            createdAt: {
                $gte: new Date(targetYear, 0, 1),
                $lte: new Date(targetYear, 11, 31, 23, 59, 59)
            }
        });

        res.json({
            success: true,
            data: {
                year: targetYear,
                totalActions,
                monthlyActivity,
                topUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete old history records (retention policy)
// @route   DELETE /api/payslip-history/cleanup
// @access  Private (Super Admin only)
const cleanupOldHistory = async (req, res) => {
    try {
        const { daysToKeep = 365 } = req.body;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

        const result = await PayslipHistory.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} old history records`,
            data: {
                deletedCount: result.deletedCount,
                cutoffDate
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
};