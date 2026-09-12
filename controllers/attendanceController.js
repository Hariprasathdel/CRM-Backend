const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const { page = 1, limit = 10, startDate, endDate, status, employeeId } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status) query.status = status;
        if (employeeId) query.employeeId = employeeId;

        const attendance = await Attendance.find(query)
            .populate('employeeId', 'name email department profileImage')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Attendance.countDocuments(query);

        res.json({
            success: true,
            data: attendance,
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

// @desc    Get attendance by ID
// @route   GET /api/attendance/:id
// @access  Private
const getAttendanceById = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id)
            .populate('employeeId', 'name email department profileImage');
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create attendance record
// @route   POST /api/attendance
// @access  Private
const createAttendance = async (req, res) => {
    try {
        const { employeeId, status, checkIn, checkOut, overtime, date } = req.body;

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if attendance already exists for this employee on this date
        const existingAttendance = await Attendance.findOne({
            employeeId,
            date: {
                $gte: new Date(date).setHours(0, 0, 0, 0),
                $lt: new Date(date).setHours(23, 59, 59, 999)
            }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already recorded for this employee on this date'
            });
        }

        const attendance = await Attendance.create({
            employeeId,
            status,
            checkIn,
            checkOut,
            overtime: overtime || 0,
            date: date || Date.now()
        });

        const populatedAttendance = await Attendance.findById(attendance._id)
            .populate('employeeId', 'name email department profileImage');

        res.status(201).json({
            success: true,
            data: populatedAttendance
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private
const updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        const { status, checkIn, checkOut, overtime } = req.body;

        attendance.status = status || attendance.status;
        attendance.checkIn = checkIn || attendance.checkIn;
        attendance.checkOut = checkOut || attendance.checkOut;
        attendance.overtime = overtime !== undefined ? overtime : attendance.overtime;

        const updatedAttendance = await attendance.save();
        
        const populatedAttendance = await Attendance.findById(updatedAttendance._id)
            .populate('employeeId', 'name email department profileImage');

        res.json({
            success: true,
            data: populatedAttendance
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private
const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findById(req.params.id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        await attendance.deleteOne();

        res.json({
            success: true,
            message: 'Attendance record deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get daily attendance statistics
// @route   GET /api/attendance/daily-stats
// @access  Private
const getDailyStats = async (req, res) => {
    try {
        const date = req.query.date ? new Date(req.query.date) : new Date();
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const stats = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: date, $lt: nextDay }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalEmployees = await Employee.countDocuments({ status: 'active' });
        
        const result = {
            present: 0,
            absent: 0,
            leave: 0,
            abuse: 0
        };

        stats.forEach(stat => {
            if (stat._id === 'present') result.present = stat.count;
            if (stat._id === 'absent') result.absent = stat.count;
            if (stat._id === 'leave') result.leave = stat.count;
            if (stat._id === 'abuse') result.abuse = stat.count;
        });

        const total = result.present + result.absent + result.leave + result.abuse;
        
        res.json({
            success: true,
            data: {
                ...result,
                total,
                totalEmployees,
                presentPercentage: total > 0 ? Math.round((result.present / total) * 100) : 0,
                absentPercentage: total > 0 ? Math.round((result.absent / total) * 100) : 0,
                leavePercentage: total > 0 ? Math.round((result.leave / total) * 100) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get monthly attendance report
// @route   GET /api/attendance/monthly-report
// @access  Private
const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const report = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        employeeId: '$employeeId',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.employeeId',
                    statuses: {
                        $push: {
                            status: '$_id.status',
                            count: '$count'
                        }
                    }
                }
            }
        ]);

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

module.exports = {
    getAttendance,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    deleteAttendance,
    getDailyStats,
    getMonthlyReport
};