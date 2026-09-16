const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide employee name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide department'],
        trim: true
    },
    position: {
        type: String,
        required: [true, 'Please provide position'],
        trim: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave'],
        default: 'active'
    },
    profileImage: {
        type: String,
        default: ''
    },
    joinDate: {
        type: Date,
        default: Date.now
    },
    address: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String
    },
    salary: {
        type: Number,
        min: 0
    },
    bankAccount: {
        bankName: String,
        accountNumber: String,
        accountHolder: String
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

// Virtual for employee age
employeeSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const age = Math.floor((new Date() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    return age;
});

// Virtual for employee initials
employeeSchema.virtual('initials').get(function() {
    return this.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
});

// Virtual for years of service
employeeSchema.virtual('yearsOfService').get(function() {
    if (!this.joinDate) return 0;
    const years = Math.floor((new Date() - this.joinDate) / (365.25 * 24 * 60 * 60 * 1000));
    return years;
});

// Pre-save middleware
employeeSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

// Pre-remove middleware - Check for dependencies
employeeSchema.pre('remove', async function(next) {
    try {
        // Check if employee has any attendance records
        const Attendance = mongoose.model('Attendance');
        const attendanceCount = await Attendance.countDocuments({ employeeId: this._id });
        if (attendanceCount > 0) {
            throw new Error('Cannot delete employee with attendance records');
        }
        
        // Check if employee has any leave records
        const Leave = mongoose.model('Leave');
        const leaveCount = await Leave.countDocuments({ employeeId: this._id });
        if (leaveCount > 0) {
            throw new Error('Cannot delete employee with leave records');
        }
        
        // Check if employee has any loans
        const Loan = mongoose.model('Loan');
        const loanCount = await Loan.countDocuments({ employeeId: this._id });
        if (loanCount > 0) {
            throw new Error('Cannot delete employee with loans');
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Indexes for better performance
employeeSchema.index({ name: 'text' });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ joinDate: -1 });

module.exports = mongoose.model('Employee', employeeSchema);