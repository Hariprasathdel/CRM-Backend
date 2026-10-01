const mongoose = require('mongoose');

const payslipHistorySchema = new mongoose.Schema({
    payslipId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payslip',
        required: true
    },
    payslipNumber: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    employeeCode: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    position: {
        type: String
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'deleted', 'generated', 'sent', 'paid', 'cancelled', 'regenerated', 'downloaded', 'printed', 'email_sent'],
        required: true
    },
    previousStatus: {
        type: String,
        enum: ['draft', 'generated', 'sent', 'paid', 'cancelled'],
        default: null
    },
    newStatus: {
        type: String,
        enum: ['draft', 'generated', 'sent', 'paid', 'cancelled'],
        default: null
    },
    payPeriod: {
        month: {
            type: Number,
            required: true,
            min: 1,
            max: 12
        },
        year: {
            type: Number,
            required: true
        }
    },
    snapshot: {
        earnings: {
            basicSalary: { type: Number, default: 0 },
            houseAllowance: { type: Number, default: 0 },
            transportAllowance: { type: Number, default: 0 },
            medicalAllowance: { type: Number, default: 0 },
            bonus: { type: Number, default: 0 },
            overtime: { type: Number, default: 0 },
            otherEarnings: { type: Number, default: 0 }
        },
        deductions: {
            tax: { type: Number, default: 0 },
            pension: { type: Number, default: 0 },
            loanRepayment: { type: Number, default: 0 },
            insurance: { type: Number, default: 0 },
            otherDeductions: { type: Number, default: 0 }
        },
        totalEarnings: { type: Number, default: 0 },
        totalDeductions: { type: Number, default: 0 },
        netPay: { type: Number, default: 0 },
        paymentMethod: String,
        bankDetails: {
            bankName: String,
            accountNumber: String,
            accountHolder: String
        }
    },
    changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    }],
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByName: {
        type: String,
        required: true
    },
    performedByRole: {
        type: String
    },
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for faster queries
payslipHistorySchema.index({ payslipId: 1, createdAt: -1 });
payslipHistorySchema.index({ employeeId: 1, createdAt: -1 });
payslipHistorySchema.index({ action: 1 });
payslipHistorySchema.index({ performedBy: 1 });
payslipHistorySchema.index({ 'payPeriod.year': 1, 'payPeriod.month': 1 });
payslipHistorySchema.index({ createdAt: -1 });

// Virtual: human-readable action description
payslipHistorySchema.virtual('actionDescription').get(function() {
    const descriptions = {
        created: `Payslip created`,
        updated: `Payslip updated`,
        deleted: `Payslip deleted`,
        generated: `Payslip generated`,
        sent: `Payslip sent to employee`,
        paid: `Payslip marked as paid`,
        cancelled: `Payslip cancelled`,
        regenerated: `Payslip regenerated`,
        downloaded: `Payslip downloaded`,
        printed: `Payslip printed`,
        email_sent: `Payslip emailed to employee`
    };
    return descriptions[this.action] || this.action;
});

// Virtual: month name
payslipHistorySchema.virtual('monthName').get(function() {
    if (!this.payPeriod || !this.payPeriod.month) return '';
    return new Date(2024, this.payPeriod.month - 1, 1).toLocaleString('default', { month: 'long' });
});

// Static: Log a payslip action
payslipHistorySchema.statics.logAction = async function(data) {
    try {
        const history = await this.create({
            payslipId: data.payslipId,
            payslipNumber: data.payslipNumber,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            employeeCode: data.employeeCode,
            department: data.department,
            position: data.position,
            action: data.action,
            previousStatus: data.previousStatus || null,
            newStatus: data.newStatus || null,
            payPeriod: data.payPeriod,
            snapshot: data.snapshot || {},
            changes: data.changes || [],
            performedBy: data.performedBy,
            performedByName: data.performedByName,
            performedByRole: data.performedByRole,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            notes: data.notes,
            metadata: data.metadata || {}
        });
        return history;
    } catch (error) {
        console.error('Error logging payslip history:', error);
        return null;
    }
};

module.exports = mongoose.model('PayslipHistory', payslipHistorySchema);