const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Employee ID is required']
    },
    employeeName: {
        type: String,
        required: true,
        trim: true
    },
    employeeCode: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
    },
    avatar: {
        type: String,
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: 2000,
        max: 2100
    },
    // Leave type balances
    balances: {
        annual: {
            total: { type: Number, default: 20, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 20, min: 0 },
            remaining: { type: Number, default: 20, min: 0 }
        },
        sick: {
            total: { type: Number, default: 12, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 12, min: 0 },
            remaining: { type: Number, default: 12, min: 0 }
        },
        casual: {
            total: { type: Number, default: 8, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 8, min: 0 },
            remaining: { type: Number, default: 8, min: 0 }
        },
        personal: {
            total: { type: Number, default: 5, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 5, min: 0 },
            remaining: { type: Number, default: 5, min: 0 }
        },
        emergency: {
            total: { type: Number, default: 3, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 3, min: 0 },
            remaining: { type: Number, default: 3, min: 0 }
        },
        maternity: {
            total: { type: Number, default: 90, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 90, min: 0 },
            remaining: { type: Number, default: 90, min: 0 }
        },
        paternity: {
            total: { type: Number, default: 15, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 15, min: 0 },
            remaining: { type: Number, default: 15, min: 0 }
        },
        unpaid: {
            total: { type: Number, default: 30, min: 0 },
            used: { type: Number, default: 0, min: 0 },
            pending: { type: Number, default: 0, min: 0 },
            carriedForward: { type: Number, default: 0, min: 0 },
            available: { type: Number, default: 30, min: 0 },
            remaining: { type: Number, default: 30, min: 0 }
        }
    },
    // Usage history
    usageHistory: [{
        leaveId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Leave'
        },
        leaveType: String,
        days: Number,
        startDate: Date,
        endDate: Date,
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled'],
            default: 'approved'
        },
        action: {
            type: String,
            enum: ['used', 'returned', 'pending', 'cancelled', 'carried_forward', 'approved']
        },
        date: { type: Date, default: Date.now },
        notes: String
    }],
    // Year-end adjustments
    carryForwardProcessed: {
        type: Boolean,
        default: false
    },
    carryForwardDate: Date,
    // Adjustments made by admin
    adjustments: [{
        leaveType: String,
        days: Number,
        reason: String,
        adjustedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        adjustedByName: String,
        adjustedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'archived'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: total available days across all types
leaveBalanceSchema.virtual('totalAvailable').get(function() {
    if (!this.balances) return 0;
    return Object.values(this.balances).reduce(
        (sum, b) => sum + (b.available || 0), 0
    );
});

// Virtual: total remaining
leaveBalanceSchema.virtual('totalRemaining').get(function() {
    if (!this.balances) return 0;
    return Object.values(this.balances).reduce(
        (sum, b) => sum + (b.remaining ?? b.available ?? 0), 0
    );
});

// Virtual: total used days
leaveBalanceSchema.virtual('totalUsed').get(function() {
    if (!this.balances) return 0;
    return Object.values(this.balances).reduce(
        (sum, b) => sum + (b.used || 0), 0
    );
});

// Virtual: total pending
leaveBalanceSchema.virtual('totalPending').get(function() {
    if (!this.balances) return 0;
    return Object.values(this.balances).reduce(
        (sum, b) => sum + (b.pending || 0), 0
    );
});

// Virtual: display avatar
leaveBalanceSchema.virtual('displayAvatar').get(function() {
    if (this.avatar) return this.avatar;
    if (this.employeeName) {
        return this.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'EM';
});

// Method: Recalculate available and remaining for a specific leave type
leaveBalanceSchema.methods.recalculateAvailable = function(type) {
    const b = this.balances[type];
    if (!b) return;
    const calc = Math.max(0, (b.total || 0) + (b.carriedForward || 0) - (b.used || 0) - (b.pending || 0));
    b.available = calc;
    b.remaining = calc;
};

// Method: Recalculate all leave types
leaveBalanceSchema.methods.recalculateAll = function() {
    Object.keys(this.balances).forEach(type => this.recalculateAvailable(type));
};

// Pre-save: recalculate all available balances and set avatar if needed
leaveBalanceSchema.pre('save', function(next) {
    if (!this.avatar && this.employeeName) {
        this.avatar = this.employeeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    this.recalculateAll();
    if (typeof next === 'function') {
        next();
    }
});

// Compound unique index: one balance record per employee per year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });
leaveBalanceSchema.index({ department: 1 });
leaveBalanceSchema.index({ year: 1 });
leaveBalanceSchema.index({ 'balances.annual.available': 1 });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);