const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: [true, 'Please provide job title'],
        trim: true,
        maxlength: [100, 'Job title cannot exceed 100 characters']
    },
    jobCode: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    vacancies: {
        type: Number,
        required: [true, 'Please provide number of vacancies'],
        min: [1, 'Vacancies must be at least 1'],
        default: 1
    },
    description: {
        type: String,
        required: [true, 'Please provide job description'],
        trim: true
    },
    responsibilities: [{
        type: String,
        trim: true
    }],
    requirements: [{
        type: String,
        trim: true
    }],
    qualifications: [{
        type: String,
        trim: true
    }],
    skills: [{
        type: String,
        trim: true
    }],
    experienceRequired: {
        min: { type: Number, default: 0, min: 0 },
        max: { type: Number, default: null, min: 0 },
        description: { type: String, trim: true }
    },
    educationRequired: {
        type: String,
        trim: true,
        enum: ['any', 'high_school', 'bachelor', 'master', 'phd', 'other'],
        default: 'any'
    },
    salaryRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
        currency: { type: String, default: 'USD' },
        isNegotiable: { type: Boolean, default: false },
        isVisible: { type: Boolean, default: true }
    },
    employmentType: {
        type: String,
        enum: ['full_time', 'part_time', 'contract', 'internship', 'freelance', 'temporary'],
        default: 'full_time'
    },
    workType: {
        type: String,
        enum: ['remote', 'onsite', 'hybrid'],
        default: 'onsite'
    },
    workLocation: {
        type: String,
        trim: true
    },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    benefits: [{
        type: String,
        trim: true
    }],
    status: {
        type: String,
        enum: ['draft', 'open', 'closed', 'on_hold', 'filled', 'cancelled'],
        default: 'draft'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    postedDate: {
        type: Date,
        default: Date.now
    },
    closingDate: {
        type: Date
    },
    filledDate: {
        type: Date
    },
    // Application tracking
    totalApplications: {
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
    rejected: {
        type: Number,
        default: 0,
        min: 0
    },
    // Assignment
    hiringManager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    hiringManagerName: {
        type: String,
        trim: true
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recruiterName: {
        type: String,
        trim: true
    },
    contactPerson: {
        name: String,
        email: String,
        phone: String
    },
    // Publishing channels
    publishedOn: [{
        channel: { type: String, trim: true },
        url: { type: String, trim: true },
        publishedAt: { type: Date, default: Date.now }
    }],
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
        uploadedAt: { type: Date, default: Date.now }
    }],
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual: days since posted
jobPostingSchema.virtual('daysPosted').get(function() {
    if (!this.postedDate) return 0;
    const diffTime = Math.abs(new Date() - this.postedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual: days until closing
jobPostingSchema.virtual('daysUntilClosing').get(function() {
    if (!this.closingDate) return null;
    const diff = Math.ceil((new Date(this.closingDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
});

// Virtual: is expired
jobPostingSchema.virtual('isExpired').get(function() {
    if (!this.closingDate) return false;
    return new Date() > new Date(this.closingDate);
});

// Virtual: application rate (applications per day)
jobPostingSchema.virtual('applicationRate').get(function() {
    const days = this.daysPosted || 1;
    if (days === 0) return 0;
    return Math.round((this.totalApplications / days) * 10) / 10;
});

// Pre-save: generate job code if missing
jobPostingSchema.pre('save', function() {
    if (!this.jobCode) {
        const year = new Date().getFullYear().toString().slice(-2);
        const deptCode = (this.department || 'GEN').substring(0, 3).toUpperCase();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.jobCode = `JOB-${deptCode}-${year}${random}`;
    }
    // Auto-close if closing date passed
    if (this.closingDate && new Date() > this.closingDate && this.status === 'open') {
        this.status = 'closed';
    }
});

// Indexes
jobPostingSchema.index({ jobTitle: 'text', description: 'text', skills: 'text' });
jobPostingSchema.index({ department: 1 });
jobPostingSchema.index({ status: 1 });
jobPostingSchema.index({ employmentType: 1 });
jobPostingSchema.index({ workType: 1 });
jobPostingSchema.index({ postedDate: -1 });
jobPostingSchema.index({ closingDate: 1 });

module.exports = mongoose.model('JobPosting', jobPostingSchema);