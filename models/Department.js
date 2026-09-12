const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide department name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Department name cannot be more than 50 characters']
    },
    code: {
        type: String,
        unique: true,
        trim: true,
        uppercase: true,
        maxlength: [10, 'Department code cannot be more than 10 characters']
    },
    description: {
        type: String,
        trim: true
    },
    head: {
        type: String,
        trim: true
    },
    headId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    employeeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    budget: {
        type: Number,
        default: 0,
        min: 0
    },
    location: {
        type: String,
        trim: true
    },
    contactEmail: {
        type: String,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    contactPhone: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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

// Virtual for employees in department
departmentSchema.virtual('employees', {
    ref: 'Employee',
    localField: 'name',
    foreignField: 'department',
    justOne: false
});

// Pre-save middleware
departmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Generate code from name if not provided
    if (!this.code && this.name) {
        this.code = this.name
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .substring(0, 5);
    }
    
    next();
});

// Pre-remove middleware
departmentSchema.pre('remove', async function(next) {
    try {
        // Check if there are employees in this department
        const Employee = mongoose.model('Employee');
        const employeeCount = await Employee.countDocuments({ department: this.name });
        if (employeeCount > 0) {
            throw new Error(`Cannot delete department with ${employeeCount} employees. Please reassign them first.`);
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Indexes for better performance
departmentSchema.index({ name: 1 });
departmentSchema.index({ code: 1 });
departmentSchema.index({ status: 1 });

module.exports = mongoose.model('Department', departmentSchema);