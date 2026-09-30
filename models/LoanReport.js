const mongoose = require('mongoose');

const loanReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide report title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    reportType: {
        type: String,
        enum: ['summary', 'detailed', 'active', 'overdue', 'defaulted', 'paid', 'employee', 'custom'],
        required: true,
        default: 'summary'
    },
    dateRange: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    department: {
        type: String,
        trim: true,
        default: 'all'
    },
    employeeIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    loanIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Loan'
    }],
    filters: {
        status: { type: String, default: 'all' },
        minAmount: { type: Number, default: 0 },
        maxAmount: { type: Number, default: null },
        paymentMethod: { type: String, default: 'all' }
    },
    summary: {
        totalLoans: { type: Number, default: 0 },
        totalLoanAmount: { type: Number, default: 0 },
        totalDisbursed: { type: Number, default: 0 },
        totalRepaid: { type: Number, default: 0 },
        totalOutstanding: { type: Number, default: 0 },
        totalInterest: { type: Number, default: 0 },
        activeLoans: { type: Number, default: 0 },
        paidLoans: { type: Number, default: 0 },
        defaultedLoans: { type: Number, default: 0 },
        pendingLoans: { type: Number, default: 0 },
        overdueLoans: { type: Number, default: 0 },
        averageLoanAmount: { type: Number, default: 0 },
        averageInterestRate: { type: Number, default: 0 },
        averageTenure: { type: Number, default: 0 },
        recoveryRate: { type: Number, default: 0 }
    },
    loanData: [{
        loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Loan' },
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeCode: String,
        employeeName: String,
        department: String,
        position: String,
        amount: Number,
        interestRate: Number,
        tenure: Number,
        monthlyInstallment: Number,
        totalPaid: Number,
        remainingAmount: Number,
        status: String,
        startDate: Date,
        endDate: Date,
        purpose: String,
        paymentMethod: String,
        daysOverdue: Number,
        progressPercentage: Number
    }],
    departmentWiseData: [{
        department: String,
        totalLoans: Number,
        totalAmount: Number,
        totalRepaid: Number,
        totalOutstanding: Number,
        activeLoans: Number,
        paidLoans: Number,
        defaultedLoans: Number,
        averageLoanAmount: Number
    }],
    statusWiseData: [{
        status: String,
        count: Number,
        amount: Number,
        percentage: Number
    }],
    monthlyTrendData: [{
        year: Number,
        month: Number,
        monthName: String,
        disbursed: Number,
        repaid: Number,
        newLoans: Number,
        closedLoans: Number
    }],
    topBorrowersData: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeName: String,
        employeeCode: String,
        department: String,
        totalBorrowed: Number,
        totalLoans: Number,
        outstanding: Number
    }],
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    exportFormats: {
        pdf: String,
        excel: String,
        csv: String
    },
    notes: { type: String, trim: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
loanReportSchema.index({ reportType: 1 });
loanReportSchema.index({ 'dateRange.startDate': -1 });
loanReportSchema.index({ generatedBy: 1 });
loanReportSchema.index({ status: 1 });
loanReportSchema.index({ department: 1 });
loanReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoanReport', loanReportSchema);