const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide project name'],
        trim: true,
        maxlength: [100, 'Project name cannot be more than 100 characters']
    },
    code: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide start date']
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['planning', 'ongoing', 'completed', 'on_hold', 'cancelled'],
        default: 'planning'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    assignedEmployees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    projectManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    budget: {
        type: Number,
        min: 0
    },
    spent: {
        type: Number,
        default: 0,
        min: 0
    },
    tasks: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee'
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'blocked'],
            default: 'pending'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        dueDate: Date,
        completedAt: Date,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    milestones: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        targetDate: Date,
        achievedDate: Date,
        status: {
            type: String,
            enum: ['pending', 'achieved', 'delayed'],
            default: 'pending'
        }
    }],
    attachments: [{
        name: String,
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
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

// Virtual for project duration in days
projectSchema.virtual('duration').get(function() {
    if (!this.startDate) return 0;
    const end = this.endDate || new Date();
    const diffTime = Math.abs(end - this.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
    if (!this.endDate || this.status === 'completed') return 0;
    const now = new Date();
    if (now > this.endDate) return 0;
    const diffTime = Math.abs(this.endDate - now);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for budget variance
projectSchema.virtual('budgetVariance').get(function() {
    if (!this.budget || this.budget === 0) return 0;
    return Math.round(((this.spent || 0) / this.budget) * 100);
});

// Pre-save middleware
projectSchema.pre('save', function() {
    this.updatedAt = Date.now();
    
    // Generate project code if not provided
    if (!this.code && this.name) {
        const words = this.name.split(' ');
        if (words.length >= 2) {
            this.code = words[0].substring(0, 2) + words[1].substring(0, 2) + 
                       new Date().getFullYear().toString().substring(2);
        } else {
            this.code = this.name.substring(0, 4) + new Date().getFullYear().toString().substring(2);
        }
        this.code = this.code.toUpperCase();
    }
    
    // Auto-update status based on dates
    if (this.endDate && this.status !== 'completed') {
        if (new Date() > this.endDate && this.status === 'ongoing') {
            this.status = 'on_hold';
        }
    }
    
    // Auto-complete if progress is 100%
    if (this.progress === 100 && this.status !== 'completed') {
        this.status = 'completed';
    }
});

// Indexes for better performance
projectSchema.index({ name: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ department: 1 });
projectSchema.index({ startDate: -1 });
projectSchema.index({ progress: 1 });

module.exports = mongoose.model('Project', projectSchema);