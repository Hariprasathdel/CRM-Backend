const mongoose = require('mongoose');

const recruitmentSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: [true, 'Please provide job title'],
        trim: true,
        maxlength: [100, 'Job title cannot be more than 100 characters']
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    vacancies: {
        type: Number,
        required: [true, 'Please provide number of vacancies'],
        min: [1, 'Vacancies must be at least 1']
    },
    description: {
        type: String,
        required: [true, 'Please provide job description'],
        trim: true
    },
    requirements: [{
        type: String,
        trim: true
    }],
    responsibilities: [{
        type: String,
        trim: true
    }],
    qualifications: [{
        type: String,
        trim: true
    }],
    experienceRequired: {
        type: Number,
        default: 0,
        min: 0
    },
    salaryRange: {
        min: {
            type: Number,
            min: 0
        },
        max: {
            type: Number,
            min: 0
        }
    },
    employmentType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance'],
        default: 'full_time'
    },
    workLocation: {
        type: String,
        trim: true
    },
    workType: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        default: 'onsite'
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'on_hold', 'draft'],
        default: 'draft'
    },
    postedDate: {
        type: Date,
        default: Date.now
    },
    closingDate: {
        type: Date
    },
    applications: {
        type: Number,
        default: 0,
        min: 0
    },
    shortlisted: {
        type: Number,
        default: 0,
        min: 0
    },
    interviewed: {
        type: Number,
        default: 0,
        min: 0
    },
    offered: {
        type: Number,
        default: 0,
        min: 0
    },
    hired: {
        type: Number,
        default: 0,
        min: 0
    },
    contactPerson: {
        name: String,
        email: String,
        phone: String
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

// Virtual for days since posted
recruitmentSchema.virtual('daysPosted').get(function() {
    if (!this.postedDate) return 0;
    const diffTime = Math.abs(new Date() - this.postedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for days until closing
recruitmentSchema.virtual('daysUntilClosing').get(function() {
    if (!this.closingDate) return null;
    const diffTime = Math.abs(this.closingDate - new Date());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for application rate
recruitmentSchema.virtual('applicationRate').get(function() {
    if (!this.postedDate || !this.applications) return 0;
    const days = this.daysPosted || 1;
    return Math.round((this.applications / days) * 10) / 10;
});

// Pre-save middleware
recruitmentSchema.pre('save', function() {
    this.updatedAt = Date.now();
    
    // Auto-close if closing date is past
    if (this.closingDate && new Date() > this.closingDate && this.status === 'open') {
        this.status = 'closed';
    }
});

// Indexes for better performance
recruitmentSchema.index({ jobTitle: 'text', description: 'text' });
recruitmentSchema.index({ department: 1 });
recruitmentSchema.index({ status: 1 });
recruitmentSchema.index({ postedDate: -1 });
recruitmentSchema.index({ employmentType: 1 });
recruitmentSchema.index({ workType: 1 });

module.exports = mongoose.model('Recruitment', recruitmentSchema);