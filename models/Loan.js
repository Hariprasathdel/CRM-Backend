const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Please provide employee ID']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide loan amount'],
        min: [0, 'Loan amount cannot be negative']
    },
    interestRate: {
        type: Number,
        required: [true, 'Please provide interest rate'],
        min: [0, 'Interest rate cannot be negative'],
        max: [100, 'Interest rate cannot exceed 100%']
    },
    tenure: {
        type: Number,
        required: [true, 'Please provide loan tenure'],
        min: [1, 'Tenure must be at least 1 month']
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date'],
        default: Date.now
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'paid', 'defaulted', 'pending'],
        default: 'pending'
    },
    monthlyInstallment: {
        type: Number,
        min: 0
    },
    totalPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingAmount: {
        type: Number,
        min: 0
    },
    purpose: {
        type: String,
        trim: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    paymentHistory: [{
        date: {
            type: Date,
            default: Date.now
        },
        amount: {
            type: Number,
            required: true
        },
        method: {
            type: String,
            enum: ['cash', 'bank_transfer', 'cheque', 'salary_deduction']
        },
        receiptNumber: {
            type: String,
            trim: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for employee
loanSchema.virtual('employee', {
    ref: 'Employee',
    localField: 'employeeId',
    foreignField: '_id',
    justOne: true
});

// Virtual for total interest
loanSchema.virtual('totalInterest').get(function() {
    if (!this.amount || !this.interestRate || !this.tenure) return 0;
    const monthlyRate = this.interestRate / 100 / 12;
    const totalPayment = this.monthlyInstallment * this.tenure;
    return Math.round((totalPayment - this.amount) * 100) / 100;
});

// Virtual for total repayment
loanSchema.virtual('totalRepayment').get(function() {
    if (!this.monthlyInstallment || !this.tenure) return 0;
    return Math.round((this.monthlyInstallment * this.tenure) * 100) / 100;
});

// Pre-save middleware
loanSchema.pre('save', function() {
    this.updatedAt = Date.now();
    
    // Calculate monthly installment if not provided
    if (!this.monthlyInstallment && this.amount && this.interestRate && this.tenure) {
        const monthlyRate = this.interestRate / 100 / 12;
        const totalPayments = this.tenure;
        this.monthlyInstallment = Math.round(
            this.amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
            (Math.pow(1 + monthlyRate, totalPayments) - 1)
        );
    }
    
    // Calculate end date
    if (this.startDate && this.tenure) {
        const endDate = new Date(this.startDate);
        endDate.setMonth(endDate.getMonth() + this.tenure);
        this.endDate = endDate;
    }
    
    // Calculate remaining amount
    if (this.amount && this.totalPaid !== undefined) {
        this.remainingAmount = Math.max(0, this.amount - this.totalPaid);
    }
    
    // Auto-update status if fully paid
    if (this.remainingAmount === 0 && this.status === 'active') {
        this.status = 'paid';
    }
    
    // Set approvedAt if status changes to active
    if (this.isModified('status') && this.status === 'active') {
        this.approvedAt = new Date();
    }
});

// Indexes for better performance
loanSchema.index({ employeeId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ startDate: -1 });
loanSchema.index({ endDate: 1 });

module.exports = mongoose.model('Loan', loanSchema);