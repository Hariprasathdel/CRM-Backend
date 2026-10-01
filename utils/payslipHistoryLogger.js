const PayslipHistory = require('../models/PayslipHistory');

/**
 * Log a payslip action to history
 * @param {Object} options - Logging options
 */
const logPayslipAction = async (options) => {
    try {
        const {
            payslip,
            action,
            user,
            req,
            previousStatus = null,
            newStatus = null,
            changes = [],
            notes = null,
            metadata = {}
        } = options;

        if (!payslip) {
            console.error('Cannot log payslip action: payslip is required');
            return null;
        }

        if (!user) {
            console.error('Cannot log payslip action: user is required');
            return null;
        }

        const historyData = {
            payslipId: payslip._id,
            payslipNumber: payslip.payslipNumber || `PS-${String(payslip._id).slice(-6)}`,
            employeeId: payslip.employeeId?._id || payslip.employeeId,
            employeeName: payslip.employeeName || payslip.employeeId?.name || 'Unknown',
            employeeCode: payslip.employeeCode || `EMP-${String(payslip.employeeId?._id || payslip.employeeId).slice(-6).toUpperCase()}`,
            department: payslip.department || payslip.employeeId?.department || 'Unknown',
            position: payslip.position || payslip.employeeId?.position,
            action,
            previousStatus,
            newStatus,
            payPeriod: payslip.payPeriod,
            snapshot: {
                earnings: payslip.earnings,
                deductions: payslip.deductions,
                totalEarnings: payslip.totalEarnings,
                totalDeductions: payslip.totalDeductions,
                netPay: payslip.netPay,
                paymentMethod: payslip.paymentMethod,
                bankDetails: payslip.bankDetails
            },
            changes,
            performedBy: user._id || user.id,
            performedByName: user.name,
            performedByRole: user.role,
            ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress,
            userAgent: req?.headers?.['user-agent'],
            notes,
            metadata
        };

        const history = await PayslipHistory.logAction(historyData);
        return history;
    } catch (error) {
        console.error('Error in logPayslipAction:', error);
        return null;
    }
};

/**
 * Calculate changes between two payslip states
 * @param {Object} oldData - Previous payslip state
 * @param {Object} newData - New payslip state
 * @returns {Array} - Array of changes
 */
const calculateChanges = (oldData, newData) => {
    const changes = [];

    const compareFields = [
        'status',
        'paymentMethod',
        'notes'
    ];

    compareFields.forEach(field => {
        if (oldData[field] !== newData[field]) {
            changes.push({
                field,
                oldValue: oldData[field],
                newValue: newData[field]
            });
        }
    });

    // Compare earnings
    if (oldData.earnings && newData.earnings) {
        Object.keys(newData.earnings).forEach(key => {
            if (oldData.earnings[key] !== newData.earnings[key]) {
                changes.push({
                    field: `earnings.${key}`,
                    oldValue: oldData.earnings[key],
                    newValue: newData.earnings[key]
                });
            }
        });
    }

    // Compare deductions
    if (oldData.deductions && newData.deductions) {
        Object.keys(newData.deductions).forEach(key => {
            if (oldData.deductions[key] !== newData.deductions[key]) {
                changes.push({
                    field: `deductions.${key}`,
                    oldValue: oldData.deductions[key],
                    newValue: newData.deductions[key]
                });
            }
        });
    }

    return changes;
};

module.exports = {
    logPayslipAction,
    calculateChanges
};