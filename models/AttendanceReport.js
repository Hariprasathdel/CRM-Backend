const mongoose = require('mongoose');

const attendanceReportSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    reportType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
        default: 'monthly'
    },
    dateRange: {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    department: { type: String, default: 'all' },
    employeeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    summary: {
        totalEmployees: { type: Number, default: 0 },
        totalWorkingDays: { type: Number, default: 0 },
        totalPresent: { type: Number, default: 0 },
        totalAbsent: { type: Number, default: 0 },
        totalLeave: { type: Number, default: 0 },
        totalAbuse: { type: Number, default: 0 },
        averageAttendance: { type: Number, default: 0 },
        presentPercentage: { type: Number, default: 0 },
        absentPercentage: { type: Number, default: 0 },
        leavePercentage: { type: Number, default: 0 }
    },
    employeeWiseData: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeName: String,
        employeeCode: String,
        department: String,
        position: String,
        presentDays: { type: Number, default: 0 },
        absentDays: { type: Number, default: 0 },
        leaveDays: { type: Number, default: 0 },
        abuseDays: { type: Number, default: 0 },
        totalDays: { type: Number, default: 0 },
        attendancePercentage: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 }
    }],
    departmentWiseData: [{
        department: String,
        totalEmployees: Number,
        presentDays: Number,
        absentDays: Number,
        leaveDays: Number,
        abuseDays: Number,
        averageAttendance: Number
    }],
    dailyData: [{
        date: Date,
        present: Number,
        absent: Number,
        leave: Number,
        abuse: Number,
        total: Number
    }],
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    notes: { type: String, trim: true }
}, { timestamps: true });

attendanceReportSchema.index({ reportType: 1 });
attendanceReportSchema.index({ 'dateRange.startDate': -1 });
attendanceReportSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('AttendanceReport', attendanceReportSchema);