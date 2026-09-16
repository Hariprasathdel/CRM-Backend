const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Please provide employee ID']
    },
    employeeName: {
        type: String,
        required: [true, 'Please provide employee name']
    },
    reason: {
        type: String,
        required: [true, 'Please provide reason for leave'],
        trim: true
    },
    type: {
        type: String,
        enum: ['annual', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'other'],
        required: [true, 'Please provide leave type']
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide end date']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    daysCount: {
        type: Number,
        min: 0
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true
    },
    attachment: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        trim: true
    },
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
leaveSchema.virtual('employee', {
    ref: 'Employee',
    localField: 'employeeId',
    foreignField: '_id',
    justOne: true
});

// Virtual for leave duration in days
leaveSchema.virtual('durationInDays').get(function() {
    if (!this.startDate || !this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
});

// Pre-save middleware
leaveSchema.pre('save', function() {
    this.updatedAt = Date.now();
    
    // Calculate days count
    if (this.startDate && this.endDate) {
        const diffTime = Math.abs(this.endDate - this.startDate);
        this.daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Set approvedAt if status changes to approved
    if (this.isModified('status') && this.status === 'approved') {
        this.approvedAt = new Date();
    }
});

// Pre-remove middleware
leaveSchema.pre('remove', function(next) {
    // Check if leave is approved before deleting
    if (this.status === 'approved') {
        throw new Error('Cannot delete approved leave request');
    }
    next();
});

// Indexes for better performance
leaveSchema.index({ employeeId: 1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ type: 1 });
leaveSchema.index({ startDate: -1, endDate: -1 });
leaveSchema.index({ 'startDate': 1, 'endDate': 1, 'employeeId': 1 }, { unique: true });

module.exports = mongoose.model('Leave', leaveSchema);