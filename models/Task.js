const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide task title'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    taskCode: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    projectName: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    assignedToNames: [{
        type: String,
        trim: true
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedByName: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['backlog', 'todo', 'in_progress', 'review', 'testing', 'completed', 'blocked', 'cancelled'],
        default: 'todo'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    type: {
        type: String,
        enum: ['feature', 'bug', 'improvement', 'documentation', 'design', 'research', 'other'],
        default: 'feature'
    },
    startDate: {
        type: Date
    },
    dueDate: {
        type: Date
    },
    completedDate: {
        type: Date
    },
    estimatedHours: {
        type: Number,
        default: 0,
        min: 0
    },
    actualHours: {
        type: Number,
        default: 0,
        min: 0
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    tags: [{
        type: String,
        trim: true
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
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        text: {
            type: String,
            required: true,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    checklist: [{
        item: {
            type: String,
            required: true,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        }
    }],
    dependencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    subtasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    }],
    parentTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    order: {
        type: Number,
        default: 0
    },
    timeTracking: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        hours: Number,
        description: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    watchers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
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

// Virtual: days remaining until due date
taskSchema.virtual('daysRemaining').get(function() {
    if (!this.dueDate) return null;
    const now = new Date();
    const due = new Date(this.dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
});

// Virtual: is overdue
taskSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate) return false;
    if (this.status === 'completed' || this.status === 'cancelled') return false;
    return new Date() > new Date(this.dueDate);
});

// Virtual: checklist progress
taskSchema.virtual('checklistProgress').get(function() {
    if (!this.checklist || this.checklist.length === 0) return 0;
    const completed = this.checklist.filter(c => c.completed).length;
    return Math.round((completed / this.checklist.length) * 100);
});

// Pre-save: generate task code if missing
taskSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    if (!this.taskCode) {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.taskCode = `TASK-${year}${random}`;
    }
    // Auto-set completed date when status changes to completed
    if (this.isModified('status') && this.status === 'completed' && !this.completedDate) {
        this.completedDate = new Date();
        this.progress = 100;
    }
    next();
});

// Indexes
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ project: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ taskCode: 1 });

module.exports = mongoose.model('Task', taskSchema);