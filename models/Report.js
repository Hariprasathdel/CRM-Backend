const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide report title'],
        trim: true,
        maxlength: [100, 'Report title cannot be more than 100 characters']
    },
    type: {
        type: String,
        enum: ['attendance', 'employee', 'leave', 'project', 'financial', 'custom'],
        required: [true, 'Please provide report type']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please provide report data']
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user who generated the report']
    },
    dateRange: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    filters: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    format: {
        type: String,
        enum: ['json', 'pdf', 'excel', 'csv'],
        default: 'json'
    },
    filePath: {
        type: String,
        default: ''
    },
    fileSize: {
        type: Number,
        min: 0
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    downloads: {
        type: Number,
        default: 0,
        min: 0
    },
    scheduled: {
        enabled: {
            type: Boolean,
            default: false
        },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly']
        },
        nextRun: {
            type: Date
        },
        recipients: [{
            type: String,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]
        }]
    },
    status: {
        type: String,
        enum: ['draft', 'generated', 'processing', 'failed'],
        default: 'draft'
    },
    error: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
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

// Virtual for report age
reportSchema.virtual('age').get(function() {
    if (!this.createdAt) return 0;
    const diffTime = Math.abs(new Date() - this.createdAt);
    return Math.ceil(diffTime / (1000 * 60 * 60));
});

// Virtual for report size in human readable format
reportSchema.virtual('sizeHuman').get(function() {
    if (!this.fileSize) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return `${(this.fileSize / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
});

// Pre-save middleware
reportSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Update status if file is generated
    if (this.filePath && this.status === 'draft') {
        this.status = 'generated';
    }
    
    next();
});

// Pre-remove middleware
reportSchema.pre('remove', function(next) {
    // Delete associated file if exists
    if (this.filePath) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '..', this.filePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
    next();
});

// Static method to generate report summary
reportSchema.statics.generateSummary = function(reports) {
    const summary = {
        total: reports.length,
        types: {},
        statuses: {},
        totalViews: 0,
        totalDownloads: 0
    };
    
    reports.forEach(report => {
        // Count by type
        summary.types[report.type] = (summary.types[report.type] || 0) + 1;
        // Count by status
        summary.statuses[report.status] = (summary.statuses[report.status] || 0) + 1;
        // Add views and downloads
        summary.totalViews += report.views || 0;
        summary.totalDownloads += report.downloads || 0;
    });
    
    return summary;
};

// Indexes for better performance
reportSchema.index({ title: 'text' });
reportSchema.index({ type: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'dateRange.start': 1, 'dateRange.end': 1 });

module.exports = mongoose.model('Report', reportSchema);