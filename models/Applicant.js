const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
    // Reference to job
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: [true, 'Job reference is required']
    },
    jobTitle: { type: String, trim: true },
    jobCode: { type: String, trim: true },
    department: { type: String, trim: true },

    // Application metadata
    applicantCode: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    applicationSource: {
        type: String,
        enum: ['website', 'linkedin', 'indeed', 'referral', 'walk_in', 'agency', 'other'],
        default: 'website'
    },
    referredBy: {
        type: String,
        trim: true
    },

    // Personal information
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true
    },
    alternatePhone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    nationality: { type: String, trim: true },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'other']
    },

    // Address
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },

    // Professional information
    currentCompany: { type: String, trim: true },
    currentPosition: { type: String, trim: true },
    totalExperience: { type: Number, default: 0, min: 0 },
    relevantExperience: { type: Number, default: 0, min: 0 },
    currentSalary: { type: Number, min: 0 },
    expectedSalary: { type: Number, min: 0 },
    noticePeriod: {
        type: String,
        enum: ['immediate', '15_days', '30_days', '60_days', '90_days', 'other']
    },
    willingToRelocate: { type: Boolean, default: false },

    // Education
    education: [{
        degree: { type: String, trim: true },
        field: { type: String, trim: true },
        institution: { type: String, trim: true },
        year: { type: Number },
        grade: { type: String, trim: true }
    }],

    // Experience
    workExperience: [{
        company: { type: String, trim: true },
        position: { type: String, trim: true },
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: { type: String, trim: true }
    }],

    // Skills & certifications
    skills: [{ type: String, trim: true }],
    certifications: [{
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String
    }],
    languages: [{
        language: String,
        proficiency: {
            type: String,
            enum: ['basic', 'intermediate', 'fluent', 'native']
        }
    }],

    // Documents
    resume: {
        filename: String,
        url: String,
        uploadedAt: Date
    },
    coverLetter: {
        text: String,
        filename: String,
        url: String
    },
    portfolio: { type: String, trim: true },
    linkedIn: { type: String, trim: true },
    github: { type: String, trim: true },
    website: { type: String, trim: true },
    documents: [{
        name: String,
        filename: String,
        url: String,
        type: { type: String },
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Status & pipeline
    status: {
        type: String,
        enum: [
            'new',
            'screening',
            'shortlisted',
            'interview_scheduled',
            'interviewed',
            'technical_round',
            'hr_round',
            'final_round',
            'offered',
            'hired',
            'rejected',
            'withdrawn',
            'on_hold',
            'talent_pool'
        ],
        default: 'new'
    },
    stage: {
        type: String,
        enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'],
        default: 'applied'
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    tags: [{ type: String, trim: true }],
    notes: { type: String, trim: true },

    // Interview & evaluation
    interviews: [{
        round: String,
        type: {
            type: String,
            enum: ['phone', 'video', 'in_person', 'technical', 'group']
        },
        scheduledDate: Date,
        duration: Number,
        interviewers: [{ type: String, trim: true }],
        location: String,
        meetingLink: String,
        status: {
            type: String,
            enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled']
        },
        feedback: String,
        score: { type: Number, min: 0, max: 10 },
        createdAt: { type: Date, default: Date.now }
    }],

    // Offer details
    offer: {
        offered: { type: Boolean, default: false },
        offerDate: Date,
        offeredSalary: Number,
        offeredPosition: String,
        joiningDate: Date,
        offerStatus: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'negotiating', 'expired']
        },
        responseDate: Date,
        notes: String
    },

    // Rejection
    rejection: {
        rejected: { type: Boolean, default: false },
        rejectedDate: Date,
        rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: {
            type: String,
            enum: ['not_qualified', 'experience_mismatch', 'salary_mismatch', 'position_filled', 'withdrew', 'other']
        },
        notes: String
    },

    // Communication log
    communications: [{
        type: {
            type: String,
            enum: ['email', 'phone', 'sms', 'whatsapp', 'in_person', 'note']
        },
        subject: String,
        message: String,
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        sentByName: String,
        sentAt: { type: Date, default: Date.now }
    }],

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedToName: { type: String, trim: true },
    lastContacted: { type: Date },
    nextFollowUp: { type: Date },

    // Additional
    isBlacklisted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
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

// Virtual: full name
applicantSchema.virtual('fullName').get(function() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

// Virtual: age from DOB
applicantSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const now = new Date();
    const dob = new Date(this.dateOfBirth);
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
});

// Virtual: days since applied
applicantSchema.virtual('daysSinceApplied').get(function() {
    if (!this.appliedDate) return 0;
    const diffTime = Math.abs(new Date() - this.appliedDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save: generate applicant code
applicantSchema.pre('save', function(next) {
    if (!this.applicantCode) {
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        this.applicantCode = `APP-${year}${random}`;
    }
    // Auto-update stage based on status
    if (this.isModified('status')) {
        const statusToStage = {
            new: 'applied',
            screening: 'screening',
            shortlisted: 'screening',
            interview_scheduled: 'interview',
            interviewed: 'interview',
            technical_round: 'interview',
            hr_round: 'interview',
            final_round: 'interview',
            offered: 'offer',
            hired: 'hired',
            rejected: 'rejected',
            withdrawn: 'rejected'
        };
        this.stage = statusToStage[this.status] || this.stage;
    }
    next();
});

// Indexes
applicantSchema.index({ firstName: 'text', lastName: 'text', email: 'text', skills: 'text' });
applicantSchema.index({ applicantCode: 1 });
applicantSchema.index({ jobId: 1 });
applicantSchema.index({ email: 1 });
applicantSchema.index({ phone: 1 });
applicantSchema.index({ status: 1 });
applicantSchema.index({ stage: 1 });
applicantSchema.index({ appliedDate: -1 });
applicantSchema.index({ assignedTo: 1 });
applicantSchema.index({ rating: -1 });

module.exports = mongoose.model('Applicant', applicantSchema);