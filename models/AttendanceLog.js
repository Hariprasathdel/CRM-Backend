const mongoose = require('mongoose');

const attendanceLogSchema = new mongoose.Schema({
    attendanceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attendance',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
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
    action: {
        type: String,
        enum: [
            'check_in',
            'check_out',
            'marked_present',
            'marked_absent',
            'marked_leave',
            'marked_abuse',
            'status_changed',
            'bulk_marked',
            'bulk_status_updated',
            'mark_all_present',
            'reset',
            'verified',
            'edited',
            'auto_marked'
        ],
        required: true
    },
    previousStatus: {
        type: String,
        enum: ['present', 'absent', 'leave', 'abuse', 'not_marked', null],
        default: null
    },
    newStatus: {
        type: String,
        enum: ['present', 'absent', 'leave', 'abuse', 'not_marked', null],
        default: null
    },
    previousCheckIn: {
        type: String,
        default: null
    },
    newCheckIn: {
        type: String,
        default: null
    },
    previousCheckOut: {
        type: String,
        default: null
    },
    newCheckOut: {
        type: String,
        default: null
    },
    attendanceDate: {
        type: Date,
        required: true
    },
    actionTime: {
        type: Date,
        default: Date.now
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    performedByName: {
        type: String,
        required: true,
        trim: true
    },
    performedByRole: {
        type: String,
        enum: ['user', 'admin', 'super_admin'],
        default: 'user'
    },
    isSelfAction: {
        type: Boolean,
        default: false
    },
    method: {
        type: String,
        enum: ['manual', 'quick_action', 'bulk', 'auto', 'api'],
        default: 'manual'
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
    ipAddress: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String,
        trim: true
    },
    deviceInfo: {
        platform: String,
        browser: String,
        version: String
    },
    workHoursAtAction: {
        type: Number,
        default: 0
    },
    overtimeAtAction: {
        type: Number,
        default: 0
    },
    changes: [{
        field: String,
        oldValue: mongoose.Schema.Types.Mixed,
        newValue: mongoose.Schema.Types.Mixed
    }],
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

// Virtual: human-readable action
attendanceLogSchema.virtual('actionLabel').get(function() {
    const labels = {
        check_in: 'Checked In',
        check_out: 'Checked Out',
        marked_present: 'Marked Present',
        marked_absent: 'Marked Absent',
        marked_leave: 'Marked Leave',
        marked_abuse: 'Marked Abuse',
        status_changed: 'Status Changed',
        bulk_marked: 'Bulk Marked',
        bulk_status_updated: 'Bulk Status Updated',
        mark_all_present: 'Marked All Present',
        reset: 'Attendance Reset',
        verified: 'Verified',
        edited: 'Edited',
        auto_marked: 'Auto Marked'
    };
    return labels[this.action] || this.action;
});

// Virtual: time difference from attendance date
attendanceLogSchema.virtual('actionDelayHours').get(function() {
    if (!this.attendanceDate || !this.actionTime) return 0;
    const diff = Math.abs(this.actionTime - this.attendanceDate);
    return Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
});

// Static: Log an attendance action
attendanceLogSchema.statics.logAction = async function(data) {
    try {
        return await this.create({
            attendanceId: data.attendanceId,
            employeeId: data.employeeId,
            employeeName: data.employeeName,
            employeeCode: data.employeeCode,
            department: data.department,
            action: data.action,
            previousStatus: data.previousStatus || null,
            newStatus: data.newStatus || null,
            previousCheckIn: data.previousCheckIn || null,
            newCheckIn: data.newCheckIn || null,
            previousCheckOut: data.previousCheckOut || null,
            newCheckOut: data.newCheckOut || null,
            attendanceDate: data.attendanceDate || new Date(),
            actionTime: data.actionTime || new Date(),
            performedBy: data.performedBy,
            performedByName: data.performedByName,
            performedByRole: data.performedByRole,
            isSelfAction: data.isSelfAction || false,
            method: data.method || 'manual',
            location: data.location,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            deviceInfo: data.deviceInfo,
            workHoursAtAction: data.workHoursAtAction || 0,
            overtimeAtAction: data.overtimeAtAction || 0,
            changes: data.changes || [],
            notes: data.notes,
            metadata: data.metadata || {}
        });
    } catch (error) {
        console.error('Error logging attendance action:', error);
        return null;
    }
};

// Static: Get logs for employee
attendanceLogSchema.statics.getEmployeeLogs = function(employeeId, limit = 50) {
    return this.find({ employeeId })
        .populate('performedBy', 'name email role')
        .sort({ actionTime: -1 })
        .limit(limit);
};

// Static: Get logs by action type
attendanceLogSchema.statics.getLogsByAction = function(action, limit = 100) {
    return this.find({ action })
        .populate('performedBy', 'name email role')
        .populate('employeeId', 'name department profileImage')
        .sort({ actionTime: -1 })
        .limit(limit);
};

// Static: Get daily summary
attendanceLogSchema.statics.getDailySummary = async function(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return this.aggregate([
        {
            $match: {
                actionTime: { $gte: start, $lt: end }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Indexes
attendanceLogSchema.index({ attendanceId: 1, actionTime: -1 });
attendanceLogSchema.index({ employeeId: 1, actionTime: -1 });
attendanceLogSchema.index({ action: 1 });
attendanceLogSchema.index({ performedBy: 1 });
attendanceLogSchema.index({ attendanceDate: -1 });
attendanceLogSchema.index({ actionTime: -1 });
attendanceLogSchema.index({ method: 1 });

module.exports = mongoose.model('AttendanceLog', attendanceLogSchema);