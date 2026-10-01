const mongoose = require('mongoose');

const awardReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide report title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    reportType: {
        type: String,
        enum: ['summary', 'detailed', 'department', 'employee', 'monthly', 'yearly', 'category', 'custom'],
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
    awardIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Award'
    }],
    filters: {
        awardType: { type: String, default: 'all' },
        year: { type: Number },
        month: { type: Number }
    },
    summary: {
        totalAwards: { type: Number, default: 0 },
        totalEmployeesAwarded: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        averageAwardAmount: { type: Number, default: 0 },
        uniqueDepartments: { type: Number, default: 0 },
        topPerformer: { type: String, default: null },
        topDepartment: { type: String, default: null },
        awardsByType: {
            gascapitol: { type: Number, default: 0 },
            coby_beach: { type: Number, default: 0 },
            best_employee: { type: Number, default: 0 },
            innovation: { type: Number, default: 0 },
            leadership: { type: Number, default: 0 },
            team_player: { type: Number, default: 0 },
            other: { type: Number, default: 0 }
        }
    },
    awardData: [{
        awardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Award' },
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeCode: String,
        employeeName: String,
        department: String,
        position: String,
        awardName: String,
        awardType: String,
        awardDate: Date,
        amount: Number,
        description: String,
        presentedBy: String,
        year: Number,
        month: Number,
        monthName: String,
        quarter: String
    }],
    departmentWiseData: [{
        department: String,
        totalAwards: Number,
        totalAmount: Number,
        uniqueEmployees: Number,
        averageAmount: Number,
        topAwardType: String
    }],
    employeeWiseData: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeCode: String,
        employeeName: String,
        department: String,
        totalAwards: Number,
        totalAmount: Number,
        awardTypes: [String],
        lastAwardDate: Date
    }],
    awardTypeWiseData: [{
        awardType: String,
        count: Number,
        totalAmount: Number,
        percentage: Number
    }],
    monthlyTrendData: [{
        year: Number,
        month: Number,
        monthName: String,
        count: Number,
        totalAmount: Number
    }],
    quarterlyData: [{
        year: Number,
        quarter: String,
        count: Number,
        totalAmount: Number
    }],
    topPerformersData: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeCode: String,
        employeeName: String,
        department: String,
        awardsCount: Number,
        totalAmount: Number
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
awardReportSchema.index({ reportType: 1 });
awardReportSchema.index({ 'dateRange.startDate': -1 });
awardReportSchema.index({ generatedBy: 1 });
awardReportSchema.index({ status: 1 });
awardReportSchema.index({ department: 1 });
awardReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AwardReport', awardReportSchema);