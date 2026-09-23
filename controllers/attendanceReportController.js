const AttendanceReport = require('../models/AttendanceReport');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// @desc    Get all attendance reports
// @route   GET /api/attendance-reports
const getAttendanceReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, reportType, status, search } = req.query;
        const query = {};
        if (reportType) query.reportType = reportType;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const reports = await AttendanceReport.find(query)
            .populate('generatedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await AttendanceReport.countDocuments(query);

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
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single attendance report
// @route   GET /api/attendance-reports/:id
const getAttendanceReportById = async (req, res) => {
    try {
        const report = await AttendanceReport.findById(req.params.id)
            .populate('generatedBy', 'name email');

        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate attendance report
// @route   POST /api/attendance-reports/generate
const generateAttendanceReport = async (req, res) => {
    try {
        const { title, reportType, startDate, endDate, department, employeeIds, notes } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            return res.status(400).json({ success: false, message: 'Start date must be before end date' });
        }

        const attendanceQuery = { date: { $gte: start, $lte: end } };
        const employeeQuery = { status: { $ne: 'inactive' } };

        if (department && department !== 'all') employeeQuery.department = department;
        if (employeeIds && employeeIds.length > 0) employeeQuery._id = { $in: employeeIds };

        const employees = await Employee.find(employeeQuery);
        const employeeIdList = employees.map(emp => emp._id);

        if (employeeIdList.length > 0) {
            attendanceQuery.employeeId = { $in: employeeIdList };
        }

        const attendanceRecords = await Attendance.find(attendanceQuery)
            .populate('employeeId', 'name email department position');

        const summary = {
            totalEmployees: employees.length,
            totalWorkingDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
            totalPresent: 0,
            totalAbsent: 0,
            totalLeave: 0,
            totalAbuse: 0,
            averageAttendance: 0,
            presentPercentage: 0,
            absentPercentage: 0,
            leavePercentage: 0
        };

        const employeeDataMap = {};
        employees.forEach(emp => {
            employeeDataMap[emp._id.toString()] = {
                employeeId: emp._id,
                employeeName: emp.name,
                employeeCode: `EMP-${String(emp._id).slice(-6).toUpperCase()}`,
                department: emp.department,
                position: emp.position,
                presentDays: 0,
                absentDays: 0,
                leaveDays: 0,
                abuseDays: 0,
                totalDays: 0,
                attendancePercentage: 0,
                overtimeHours: 0
            };
        });

        const dailyDataMap = {};

        attendanceRecords.forEach(record => {
            const empId = record.employeeId?._id?.toString();
            if (!empId || !employeeDataMap[empId]) return;

            switch (record.status) {
                case 'present':
                    summary.totalPresent++;
                    employeeDataMap[empId].presentDays++;
                    break;
                case 'absent':
                    summary.totalAbsent++;
                    employeeDataMap[empId].absentDays++;
                    break;
                case 'leave':
                    summary.totalLeave++;
                    employeeDataMap[empId].leaveDays++;
                    break;
                case 'abuse':
                    summary.totalAbuse++;
                    employeeDataMap[empId].abuseDays++;
                    break;
            }

            employeeDataMap[empId].totalDays++;
            employeeDataMap[empId].overtimeHours += record.overtime || 0;

            const dateKey = new Date(record.date).toISOString().split('T')[0];
            if (!dailyDataMap[dateKey]) {
                dailyDataMap[dateKey] = {
                    date: new Date(record.date),
                    present: 0, absent: 0, leave: 0, abuse: 0, total: 0
                };
            }
            dailyDataMap[dateKey][record.status]++;
            dailyDataMap[dateKey].total++;
        });

        const employeeWiseData = Object.values(employeeDataMap).map(emp => ({
            ...emp,
            attendancePercentage: emp.totalDays > 0
                ? Math.round((emp.presentDays / emp.totalDays) * 100 * 100) / 100
                : 0
        }));

        const totalRecords = summary.totalPresent + summary.totalAbsent + 
                            summary.totalLeave + summary.totalAbuse;

        if (totalRecords > 0) {
            summary.presentPercentage = Math.round((summary.totalPresent / totalRecords) * 100 * 100) / 100;
            summary.absentPercentage = Math.round((summary.totalAbsent / totalRecords) * 100 * 100) / 100;
            summary.leavePercentage = Math.round((summary.totalLeave / totalRecords) * 100 * 100) / 100;
            summary.averageAttendance = summary.presentPercentage;
        }

        const departmentMap = {};
        employeeWiseData.forEach(emp => {
            if (!departmentMap[emp.department]) {
                departmentMap[emp.department] = {
                    department: emp.department,
                    totalEmployees: 0,
                    presentDays: 0,
                    absentDays: 0,
                    leaveDays: 0,
                    abuseDays: 0,
                    averageAttendance: 0
                };
            }
            departmentMap[emp.department].totalEmployees++;
            departmentMap[emp.department].presentDays += emp.presentDays;
            departmentMap[emp.department].absentDays += emp.absentDays;
            departmentMap[emp.department].leaveDays += emp.leaveDays;
            departmentMap[emp.department].abuseDays += emp.abuseDays;
        });

        const departmentWiseData = Object.values(departmentMap).map(dept => {
            const total = dept.presentDays + dept.absentDays + dept.leaveDays + dept.abuseDays;
            return {
                ...dept,
                averageAttendance: total > 0
                    ? Math.round((dept.presentDays / total) * 100 * 100) / 100
                    : 0
            };
        });

        const dailyData = Object.values(dailyDataMap).sort(
            (a, b) => new Date(a.date) - new Date(b.date)
        );

        const report = await AttendanceReport.create({
            title: title || `Attendance Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            reportType: reportType || 'custom',
            dateRange: { startDate: start, endDate: end },
            department: department || 'all',
            employeeIds: employeeIdList,
            summary,
            employeeWiseData,
            departmentWiseData,
            dailyData,
            filters: { department, employeeIds },
            generatedBy: req.user.id,
            status: 'completed',
            notes
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'Attendance report generated successfully'
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete attendance report
// @route   DELETE /api/attendance-reports/:id
const deleteAttendanceReport = async (req, res) => {
    try {
        const report = await AttendanceReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        await report.deleteOne();
        res.json({ success: true, message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance summary
// @route   GET /api/attendance-reports/summary
const getAttendanceSummary = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const query = { date: { $gte: start, $lte: end } };
        const employeeQuery = { status: { $ne: 'inactive' } };

        if (department && department !== 'all') employeeQuery.department = department;

        const employees = await Employee.find(employeeQuery);
        const employeeIds = employees.map(emp => emp._id);

        if (employeeIds.length > 0) query.employeeId = { $in: employeeIds };

        const stats = await Attendance.aggregate([
            { $match: query },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const summary = {
            totalEmployees: employees.length,
            present: 0, absent: 0, leave: 0, abuse: 0,
            dateRange: { startDate: start, endDate: end }
        };

        stats.forEach(stat => {
            if (stat._id === 'present') summary.present = stat.count;
            if (stat._id === 'absent') summary.absent = stat.count;
            if (stat._id === 'leave') summary.leave = stat.count;
            if (stat._id === 'abuse') summary.abuse = stat.count;
        });

        const total = summary.present + summary.absent + summary.leave + summary.abuse;
        summary.presentPercentage = total > 0 ? Math.round((summary.present / total) * 100) : 0;
        summary.absentPercentage = total > 0 ? Math.round((summary.absent / total) * 100) : 0;
        summary.leavePercentage = total > 0 ? Math.round((summary.leave / total) * 100) : 0;
        summary.abusePercentage = total > 0 ? Math.round((summary.abuse / total) * 100) : 0;

        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance trend
// @route   GET /api/attendance-reports/trend
const getAttendanceTrend = async (req, res) => {
    try {
        const { months = 6, department } = req.query;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const query = { date: { $gte: startDate, $lte: endDate } };

        if (department && department !== 'all') {
            const employees = await Employee.find({ department, status: { $ne: 'inactive' } });
            query.employeeId = { $in: employees.map(e => e._id) };
        }

        const trend = await Attendance.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const trendMap = {};
        trend.forEach(item => {
            const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            if (!trendMap[key]) {
                trendMap[key] = {
                    year: item._id.year,
                    month: item._id.month,
                    monthName: new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short' }),
                    present: 0, absent: 0, leave: 0, abuse: 0, total: 0
                };
            }
            trendMap[key][item._id.status] = item.count;
            trendMap[key].total += item.count;
        });

        const trendData = Object.values(trendMap).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        res.json({ success: true, data: trendData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAttendanceReports,
    getAttendanceReportById,
    generateAttendanceReport,
    deleteAttendanceReport,
    getAttendanceSummary,
    getAttendanceTrend
};