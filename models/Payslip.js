const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Please provide employee ID']
    },
    employeeName: {
        type: String,
        required: [true, 'Please provide employee name']
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
        type: String,
        required: true
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
    earnings: {
        basicSalary: {
            type: Number,
            required: true,
            min: 0
        },
        houseAllowance: {
            type: Number,
            default: 0,
            min: 0
        },
        transportAllowance: {
            type: Number,
            default: 0,
            min: 0
        },
        medicalAllowance: {
            type: Number,
            default: 0,
            min: 0
        },
        bonus: {
            type: Number,
            default: 0,
            min: 0
        },
        overtime: {
            type: Number,
            default: 0,
            min: 0
        },
        otherEarnings: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    deductions: {
        tax: {
            type: Number,
            default: 0,
            min: 0
        },
        pension: {
            type: Number,
            default: 0,
            min: 0
        },
        loanRepayment: {
            type: Number,
            default: 0,
            min: 0
        },
        insurance: {
            type: Number,
            default: 0,
            min: 0
        },
        otherDeductions: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    totalEarnings: {
        type: Number,
        required: true,
        min: 0
    },
    totalDeductions: {
        type: Number,
        required: true,
        min: 0
    },
    netPay: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMethod: {
        type: String,
        enum: ['bank_transfer', 'cash', 'cheque'],
        default: 'bank_transfer'
    },
    bankDetails: {
        bankName: String,
        accountNumber: String,
        accountHolder: String
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'sent', 'paid'],
        default: 'draft'
    },
    notes: {
        type: String,
        trim: true
    },
    payslipNumber: {
        type: String,
        unique: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    sentAt: Date,
    paidAt: Date,
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

// Generate payslip number before saving
payslipSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (!this.payslipNumber) {
        const year = this.payPeriod.year.toString().slice(-2);
        const month = String(this.payPeriod.month).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.payslipNumber = `PS-${year}${month}-${random}`;
    }
    next();
});

// Indexes
payslipSchema.index({ employeeId: 1 });
payslipSchema.index({ payslipNumber: 1 });
payslipSchema.index({ 'payPeriod.month': 1, 'payPeriod.year': 1 });
payslipSchema.index({ status: 1 });

module.exports = mongoose.model('Payslip', payslipSchema);