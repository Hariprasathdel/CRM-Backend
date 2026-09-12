const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'Please provide employee ID']
    },
    date: {
        type: Date,
        required: [true, 'Please provide date'],
        default: Date.now
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'leave', 'abuse'],
        required: [true, 'Please provide attendance status']
    },
    checkIn: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format HH:MM']
    },
    checkOut: {
        type: String,
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide valid time format HH:MM']
    },
    overtime: {
        type: Number,
        default: 0,
        min: 0
    },
    workHours: {
        type: Number,
        default: 0,
        min: 0
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    notes: {
        type: String,
        trim: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

// Virtual for employee name
attendanceSchema.virtual('employeeName', {
    ref: 'Employee',
    localField: 'employeeId',
    foreignField: '_id',
    justOne: true
});

// Pre-save middleware
attendanceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Calculate work hours if checkIn and checkOut are provided
    if (this.checkIn && this.checkOut) {
        const [inHour, inMin] = this.checkIn.split(':').map(Number);
        const [outHour, outMin] = this.checkOut.split(':').map(Number);
        const inTotal = inHour * 60 + inMin;
        const outTotal = outHour * 60 + outMin;
        this.workHours = Math.round((outTotal - inTotal) / 60 * 10) / 10;
        
        // Calculate overtime (if work hours > 8)
        if (this.workHours > 8) {
            this.overtime = Math.round((this.workHours - 8) * 10) / 10;
        }
    }
    
    next();
});

// Compound index for unique attendance per day per employee
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

// Indexes for better performance
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Attendance', attendanceSchema);