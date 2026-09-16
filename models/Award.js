const mongoose = require('mongoose');

const awardSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Please provide employee ID']
    },
    employeeName: {
        type: String,
        required: [true, 'Please provide employee name'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    awardName: {
        type: String,
        required: [true, 'Please provide award name'],
        trim: true
    },
    type: {
        type: String,
        enum: ['gascapitol', 'coby_beach', 'best_employee', 'innovation', 'leadership', 'team_player', 'other'],
        required: [true, 'Please provide award type']
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        trim: true
    },
    certificate: {
        type: String,
        default: ''
    },
    presentedBy: {
        type: String,
        trim: true
    },
    amount: {
        type: Number,
        min: 0
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
awardSchema.virtual('employee', {
    ref: 'Employee',
    localField: 'employeeId',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware
awardSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

// Indexes for better performance
awardSchema.index({ employeeId: 1 });
awardSchema.index({ type: 1 });
awardSchema.index({ date: -1 });
awardSchema.index({ department: 1 });

module.exports = mongoose.model('Award', awardSchema);