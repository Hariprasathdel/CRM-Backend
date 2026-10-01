const mongoose = require('mongoose');

const savedReportSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for the saved report'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    reportCategory: {
        type: String,
        enum: ['attendance', 'employee', 'leave', 'loan', 'payslip', 'project', 'recruitment', 'award', 'task', 'financial', 'custom'],
        required: [true, 'Please provide report category']
    },
    reportType: {
        type: String,
        required: true,
        trim: true
    },
    // The actual report configuration to be replayed
    configuration: {
        // Filters
        dateRange: {
            startDate: Date,
            endDate: Date,
            preset: {
                type: String,
                enum: ['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'last_quarter', 'this_year', 'last_year', 'custom', null],
                default: null
            }
        },
        filters: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        // Columns to include in report
        columns: [{
            key: String,
            label: String,
            width: Number,
            align: {
                type: String,
                enum: ['left', 'center', 'right'],
                default: 'left'
            }
        }],
        // Sorting
        sorting: {
            field: String,
            direction: {
                type: String,
                enum: ['asc', 'desc'],
                default: 'desc'
            }
        },
        // Grouping
        groupBy: {
            type: String,
            default: null
        },
        // Aggregations
        aggregations: [{
            field: String,
            type: {
                type: String,
                enum: ['sum', 'avg', 'count', 'min', 'max']
            },
            label: String
        }],
        // Chart configuration
        charts: [{
            type: {
                type: String,
                enum: ['bar', 'line', 'pie', 'doughnut', 'area']
            },
            title: String,
            dataKey: String,
            labelKey: String
        }],
        // Export options
        exportOptions: {
            format: {
                type: String,
                enum: ['pdf', 'excel', 'csv'],
                default: 'pdf'
            },
            includeCharts: { type: Boolean, default: false },
            includeSummary: { type: Boolean, default: true }
        }
    },
    // Sharing & permissions
    visibility: {
        type: String,
        enum: ['private', 'team', 'department', 'public'],
        default: 'private'
    },
    sharedWith: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        permission: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        },
        sharedAt: {
            type: Date,
            default: Date.now
        }
    }],
    sharedWithDepartments: [{
        type: String,
        trim: true
    }],
    sharedWithRoles: [{
        type: String,
        enum: ['user', 'admin', 'super_admin']
    }],
    // Usage tracking
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    lastUsedAt: {
        type: Date
    },
    lastRunAt: {
        type: Date
    },
    runHistory: [{
        runAt: {
            type: Date,
            default: Date.now
        },
        runBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        runByName: String,
        rowCount: Number,
        executionTimeMs: Number,
        status: {
            type: String,
            enum: ['success', 'failed'],
            default: 'success'
        },
        errorMessage: String
    }],
    // Scheduling
    schedule: {
        enabled: { type: Boolean, default: false },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly'],
            default: null
        },
        dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sunday
        dayOfMonth: { type: Number, min: 1, max: 31 },
        time: { type: String }, // HH:MM format
        recipients: [{
            email: String,
            name: String
        }],
        lastRunAt: Date,
        nextRunAt: Date
    },
    // Organization
    tags: [{
        type: String,
        trim: true
    }],
    isFavorite: {
        type: Boolean,
        default: false
    },
    isTemplate: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedAt: {
        type: Date
    },
    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdByName: {
        type: String,
        trim: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedByName: {
        type: String,
        trim: true
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

// Virtual: age in days
savedReportSchema.virtual('ageInDays').get(function() {
    if (!this.createdAt) return 0;
    const diffTime = Math.abs(new Date() - this.createdAt);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: is scheduled
savedReportSchema.virtual('isScheduled').get(function() {
    return this.schedule && this.schedule.enabled;
});

// Virtual: share count
savedReportSchema.virtual('shareCount').get(function() {
    return (this.sharedWith?.length || 0) +
           (this.sharedWithDepartments?.length || 0) +
           (this.sharedWithRoles?.length || 0);
});

// Virtual: category label
savedReportSchema.virtual('categoryLabel').get(function() {
    const labels = {
        attendance: 'Attendance Reports',
        employee: 'Employee Reports',
        leave: 'Leave Reports',
        loan: 'Loan Reports',
        payslip: 'Payslip Reports',
        project: 'Project Reports',
        recruitment: 'Recruitment Reports',
        award: 'Award Reports',
        task: 'Task Reports',
        financial: 'Financial Reports',
        custom: 'Custom Reports'
    };
    return labels[this.reportCategory] || 'Reports';
});

// Pre-save middleware
savedReportSchema.pre('save', function(next) {
    // Auto-compute next run time if schedule enabled
    if (this.schedule && this.schedule.enabled && this.schedule.frequency) {
        const next = new Date();
        switch (this.schedule.frequency) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            case 'quarterly':
                next.setMonth(next.getMonth() + 3);
                break;
        }
        this.schedule.nextRunAt = next;
    }
    next();
});

// Indexes
savedReportSchema.index({ name: 'text', description: 'text', tags: 'text' });
savedReportSchema.index({ reportCategory: 1 });
savedReportSchema.index({ createdBy: 1, createdAt: -1 });
savedReportSchema.index({ visibility: 1 });
savedReportSchema.index({ isFavorite: 1 });
savedReportSchema.index({ isArchived: 1 });
savedReportSchema.index({ 'schedule.enabled': 1, 'schedule.nextRunAt': 1 });
savedReportSchema.index({ usageCount: -1 });
savedReportSchema.index({ lastUsedAt: -1 });
savedReportSchema.index({ tags: 1 });

module.exports = mongoose.model('SavedReport', savedReportSchema);