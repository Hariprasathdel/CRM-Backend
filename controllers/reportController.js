const Report = require('../models/Report');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Project = require('../models/Project');
const Loan = require('../models/Loan');

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, search } = req.query;
        
        const query = {};
        if (type) query.type = type;
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        const reports = await Report.find(query)
            .populate('generatedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Report.countDocuments(query);

        res.json({
            success: true,
            data: reports,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('generatedBy', 'name email');
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res) => {
    try {
        const { title, type, data, dateRange } = req.body;

        const report = await Report.create({
            title,
            type,
            data,
            generatedBy: req.user.id,
            dateRange: {
                start: dateRange?.start || new Date(),
                end: dateRange?.end || new Date()
            }
        });

        const populatedReport = await Report.findById(report._id)
            .populate('generatedBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const { title, type, data, dateRange } = req.body;

        report.title = title || report.title;
        report.type = type || report.type;
        report.data = data || report.data;
        if (dateRange) {
            report.dateRange = dateRange;
        }

        const updatedReport = await report.save();
        
        const populatedReport = await Report.findById(updatedReport._id)
            .populate('generatedBy', 'name email');

        res.json({
            success: true,
            data: populatedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate attendance report
// @route   GET /api/reports/generate/attendance
// @access  Private
const generateAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);

        const attendanceData = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        const totalEmployees = await Employee.countDocuments({ status: 'active' });

        const report = {
            title: `Attendance Report (${startDate} to ${endDate})`,
            type: 'attendance',
            data: {
                period: { startDate, endDate },
                totalDays,
                totalEmployees,
                attendance: attendanceData,
                summary: {
                    totalPresent: attendanceData.find(d => d._id === 'present')?.count || 0,
                    totalAbsent: attendanceData.find(d => d._id === 'absent')?.count || 0,
                    totalLeave: attendanceData.find(d => d._id === 'leave')?.count || 0,
                    totalAbuse: attendanceData.find(d => d._id === 'abuse')?.count || 0,
                }
            },
            generatedBy: req.user.id,
            dateRange: { start, end }
        };

        const savedReport = await Report.create(report);
        
        res.json({
            success: true,
            data: savedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate employee report
// @route   GET /api/reports/generate/employee
// @access  Private
const generateEmployeeReport = async (req, res) => {
    try {
        const employees = await Employee.find();
        
        const departmentStats = await Employee.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusStats = await Employee.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const report = {
            title: `Employee Report - ${new Date().toLocaleDateString()}`,
            type: 'employee',
            data: {
                totalEmployees: employees.length,
                departments: departmentStats,
                status: statusStats,
                employees: employees.map(e => ({
                    name: e.name,
                    department: e.department,
                    position: e.position,
                    status: e.status,
                    joinDate: e.joinDate
                }))
            },
            generatedBy: req.user.id,
            dateRange: {
                start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                end: new Date()
            }
        };

        const savedReport = await Report.create(report);
        
        res.json({
            success: true,
            data: savedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate leave report
// @route   GET /api/reports/generate/leave
// @access  Private
const generateLeaveReport = async (req, res) => {
    try {
        const { year } = req.query;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const leaveData = await Leave.aggregate([
            {
                $match: {
                    startDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        type: '$type',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const report = {
            title: `Leave Report ${year}`,
            type: 'leave',
            data: {
                year,
                totalLeaves: leaveData.reduce((sum, d) => sum + d.count, 0),
                breakdown: leaveData
            },
            generatedBy: req.user.id,
            dateRange: { start: startDate, end: endDate }
        };

        const savedReport = await Report.create(report);
        
        res.json({
            success: true,
            data: savedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate project report
// @route   GET /api/reports/generate/project
// @access  Private
const generateProjectReport = async (req, res) => {
    try {
        const projects = await Project.find().populate('assignedEmployees', 'name');
        
        const statusStats = await Project.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    avgProgress: { $avg: '$progress' }
                }
            }
        ]);

        const report = {
            title: `Project Report - ${new Date().toLocaleDateString()}`,
            type: 'project',
            data: {
                totalProjects: projects.length,
                status: statusStats,
                projects: projects.map(p => ({
                    name: p.name,
                    department: p.department,
                    status: p.status,
                    progress: p.progress,
                    assignedEmployees: p.assignedEmployees.map(e => e.name)
                }))
            },
            generatedBy: req.user.id,
            dateRange: {
                start: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                end: new Date()
            }
        };

        const savedReport = await Report.create(report);
        
        res.json({
            success: true,
            data: savedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate financial report
// @route   GET /api/reports/generate/financial
// @access  Private
const generateFinancialReport = async (req, res) => {
    try {
        const loans = await Loan.find();
        
        const totalLoans = loans.reduce((sum, l) => sum + l.amount, 0);
        const activeLoans = loans.filter(l => l.status === 'active');
        const totalActive = activeLoans.reduce((sum, l) => sum + l.amount, 0);
        const totalPaid = loans.filter(l => l.status === 'paid').reduce((sum, l) => sum + l.amount, 0);
        const totalDefaulted = loans.filter(l => l.status === 'defaulted').reduce((sum, l) => sum + l.amount, 0);

        const report = {
            title: `Financial Report - ${new Date().toLocaleDateString()}`,
            type: 'financial',
            data: {
                totalLoans,
                totalActive,
                totalPaid,
                totalDefaulted,
                loans: loans.map(l => ({
                    employee: l.employeeId,
                    amount: l.amount,
                    interestRate: l.interestRate,
                    tenure: l.tenure,
                    status: l.status
                }))
            },
            generatedBy: req.user.id,
            dateRange: {
                start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
                end: new Date()
            }
        };

        const savedReport = await Report.create(report);
        
        res.json({
            success: true,
            data: savedReport
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    getReports,
    getReportById,
    createReport,
    updateReport,
    deleteReport,
    generateAttendanceReport,
    generateEmployeeReport,
    generateLeaveReport,
    generateProjectReport,
    generateFinancialReport
};