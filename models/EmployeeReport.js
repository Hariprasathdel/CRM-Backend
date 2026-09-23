const mongoose = require('mongoose');

const employeeReportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide report title'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    reportType: {
        type: String,
        enum: ['summary', 'detailed', 'department', 'designation', 'performance', 'attrition', 'custom'],
        required: true,
        default: 'summary'
    },
    dateRange: {
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        }
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
    filters: {
        status: { type: String, default: 'all' },
        gender: { type: String, default: 'all' },
        employmentType: { type: String, default: 'all' }
    },
    summary: {
        totalEmployees: { type: Number, default: 0 },
        activeEmployees: { type: Number, default: 0 },
        inactiveEmployees: { type: Number, default: 0 },
        onLeaveEmployees: { type: Number, default: 0 },
        newHires: { type: Number, default: 0 },
        terminated: { type: Number, default: 0 },
        totalDepartments: { type: Number, default: 0 },
        averageTenure: { type: Number, default: 0 },
        averageAge: { type: Number, default: 0 },
        maleCount: { type: Number, default: 0 },
        femaleCount: { type: Number, default: 0 },
        otherCount: { type: Number, default: 0 },
        totalPayroll: { type: Number, default: 0 },
        averageSalary: { type: Number, default: 0 }
    },
    employeeData: [{
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        employeeCode: String,
        name: String,
        email: String,
        phone: String,
        department: String,
        position: String,
        status: String,
        joinDate: Date,
        dateOfBirth: Date,
        age: Number,
        gender: String,
        address: String,
        salary: Number,
        tenure: Number,
        yearsOfService: Number,
        lastLogin: Date,
        createdAt: Date
    }],
    departmentWiseData: [{
        department: String,
        totalEmployees: Number,
        activeEmployees: Number,
        inactiveEmployees: Number,
        onLeaveEmployees: Number,
        maleCount: Number,
        femaleCount: Number,
        averageAge: Number,
        averageSalary: Number,
        totalPayroll: Number
    }],
    designationWiseData: [{
        position: String,
        count: Number,
        department: String,
        averageSalary: Number
    }],
    statusWiseData: [{
        status: String,
        count: Number,
        percentage: Number
    }],
    genderWiseData: [{
        gender: String,
        count: Number,
        percentage: Number
    }],
    ageGroupWiseData: [{
        ageGroup: String,
        count: Number,
        percentage: Number
    }],
    tenureWiseData: [{
        tenureGroup: String,
        count: Number,
        percentage: Number
    }],
    hireTrendData: [{
        year: Number,
        month: Number,
        monthName: String,
        hires: Number,
        terminations: Number,
        netChange: Number
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
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
employeeReportSchema.index({ reportType: 1 });
employeeReportSchema.index({ 'dateRange.startDate': -1 });
employeeReportSchema.index({ generatedBy: 1 });
employeeReportSchema.index({ status: 1 });
employeeReportSchema.index({ department: 1 });
employeeReportSchema.index({ createdAt: -1 });

// Virtual for report age
employeeReportSchema.virtual('age').get(function() {
    if (!this.createdAt) return 0;
    const diffTime = Math.abs(new Date() - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60));
});

module.exports = mongoose.model('EmployeeReport', employeeReportSchema);