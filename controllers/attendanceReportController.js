const AttendanceReport = require('../models/AttendanceReport');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Department = require('../models/Department');

// Helper to parse date range
const parseDates = (startDate, endDate) => {
    let start, end;
    if (startDate) {
        start = new Date(startDate);
    } else {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    start.setHours(0, 0, 0, 0);

    if (endDate) {
        end = new Date(endDate);
    } else {
        end = new Date();
    }
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

// @desc    Get live employee attendance report or saved reports
// @route   GET /api/attendance-reports
const getAttendanceReports = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            startDate, 
            endDate, 
            department, 
            status, 
            search, 
            sortBy = 'employeeName', 
            sortOrder = 'asc',
            saved
        } = req.query;

        // If explicitly requesting saved reports from AttendanceReport collection
        if (saved === 'true') {
            const query = {};
            if (search) query.title = { $regex: search, $options: 'i' };

            const reports = await AttendanceReport.find(query)
                .populate('generatedBy', 'name email')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await AttendanceReport.countDocuments(query);

            return res.json({
                success: true,
                data: reports,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit) || 1
                }
            });
        }

        // Live aggregated attendance report across employees
        const { start, end } = parseDates(startDate, endDate);

        // Build Employee query
        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all' && department !== 'All' && department.trim() !== '') {
            employeeQuery.department = { $regex: new RegExp(department.trim(), 'i') };
        }
        if (search && search.trim() !== '') {
            employeeQuery.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { position: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        const employees = await Employee.find(employeeQuery).lean();
        const employeeIds = employees.map(e => e._id);

        // Build Attendance query
        const attendanceQuery = {
            date: { $gte: start, $lte: end },
            employeeId: { $in: employeeIds }
        };

        const records = await Attendance.find(attendanceQuery).lean();

        // Group attendance by employee
        const recordsByEmp = {};
        employees.forEach(emp => {
            recordsByEmp[emp._id.toString()] = [];
        });

        records.forEach(rec => {
            const empIdStr = rec.employeeId?.toString();
            if (recordsByEmp[empIdStr]) {
                recordsByEmp[empIdStr].push(rec);
            }
        });

        // Compute employee-wise metrics
        let employeeRows = employees.map(emp => {
            const empRecords = recordsByEmp[emp._id.toString()] || [];
            let presentDays = 0;
            let absentDays = 0;
            let leaveDays = 0;
            let lateDays = 0;
            let totalWorkingHours = 0;
            let totalOvertime = 0;

            empRecords.forEach(r => {
                const s = (r.status || '').toLowerCase();
                if (s === 'present') presentDays++;
                else if (s === 'absent') absentDays++;
                else if (s === 'leave') leaveDays++;
                else if (s === 'late' || s === 'abuse') lateDays++;

                totalWorkingHours += (r.workingHours || (s === 'present' ? 8 : 0));
                totalOvertime += (r.overtime || 0);
            });

            const totalDays = presentDays + absentDays + leaveDays + lateDays;
            const attendanceRate = totalDays > 0 
                ? Math.round((presentDays / totalDays) * 100 * 10) / 10 
                : 0;

            let performanceStatus = 'Good';
            if (attendanceRate >= 90) performanceStatus = 'Excellent';
            else if (attendanceRate >= 75) performanceStatus = 'Good';
            else if (attendanceRate >= 60) performanceStatus = 'Average';
            else if (totalDays > 0) performanceStatus = 'Poor';
            else performanceStatus = 'Average';

            const empCode = emp.employeeCode || `EMP-${String(emp._id).slice(-4).toUpperCase()}`;

            return {
                _id: emp._id,
                id: emp._id,
                employeeName: emp.name,
                employeeId: empCode,
                department: emp.department || 'General',
                position: emp.position || 'Staff',
                presentDays,
                absentDays,
                leaveDays,
                lateDays,
                totalDays,
                attendanceRate,
                performanceStatus,
                totalWorkingHours,
                totalOvertime
            };
        });

        // Filter by status if specified
        if (status && status !== 'all' && status !== 'All') {
            const sLower = status.toLowerCase();
            if (sLower === 'present') {
                employeeRows = employeeRows.filter(r => r.presentDays > 0);
            } else if (sLower === 'absent') {
                employeeRows = employeeRows.filter(r => r.absentDays > 0);
            } else if (sLower === 'leave') {
                employeeRows = employeeRows.filter(r => r.leaveDays > 0);
            } else if (sLower === 'late') {
                employeeRows = employeeRows.filter(r => r.lateDays > 0);
            }
        }

        // Sorting
        employeeRows.sort((a, b) => {
            let valA = a[sortBy] ?? '';
            let valB = b[sortBy] ?? '';
            if (typeof valA === 'string') {
                const cmp = valA.localeCompare(String(valB));
                return sortOrder === 'desc' ? -cmp : cmp;
            }
            return sortOrder === 'desc' ? valB - valA : valA - valB;
        });

        // Pagination
        const total = employeeRows.length;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.max(1, parseInt(limit));
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedData = employeeRows.slice(startIndex, startIndex + limitNum);

        res.json({
            success: true,
            data: paginatedData,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum) || 1
            }
        });
    } catch (error) {
        console.error('Error in getAttendanceReports:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get attendance summary
// @route   GET /api/attendance-reports/summary
const getAttendanceSummary = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        const { start, end } = parseDates(startDate, endDate);

        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all' && department !== 'All' && department.trim() !== '') {
            employeeQuery.department = { $regex: new RegExp(department.trim(), 'i') };
        }

        const employees = await Employee.find(employeeQuery).lean();
        const employeeIds = employees.map(emp => emp._id);

        const query = {
            date: { $gte: start, $lte: end },
            employeeId: { $in: employeeIds }
        };

        const records = await Attendance.find(query).lean();

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLeave = 0;
        let totalLate = 0;
        let totalHours = 0;
        let totalOvertime = 0;

        records.forEach(r => {
            const s = (r.status || '').toLowerCase();
            if (s === 'present') {
                totalPresent++;
                totalHours += (r.workingHours || 8);
            } else if (s === 'absent') {
                totalAbsent++;
            } else if (s === 'leave') {
                totalLeave++;
            } else if (s === 'late' || s === 'abuse') {
                totalLate++;
                totalHours += (r.workingHours || 6);
            }
            totalOvertime += (r.overtime || 0);
        });

        const totalRecords = totalPresent + totalAbsent + totalLeave + totalLate;
        const avgWorkingHours = totalPresent > 0 ? Math.round((totalHours / totalPresent) * 10) / 10 : 0;

        const summary = {
            totalEmployees: employees.length,
            totalPresent,
            totalAbsent,
            totalLeave,
            totalLate,
            present: totalPresent,
            absent: totalAbsent,
            leave: totalLeave,
            late: totalLate,
            avgWorkingHours,
            totalOvertime,
            presentPercentage: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
            absentPercentage: totalRecords > 0 ? Math.round((totalAbsent / totalRecords) * 100) : 0,
            leavePercentage: totalRecords > 0 ? Math.round((totalLeave / totalRecords) * 100) : 0,
            dateRange: { startDate: start, endDate: end }
        };

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error in getAttendanceSummary:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get daily attendance trend
// @route   GET /api/attendance-reports/trend
const getAttendanceTrend = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;
        let start, end;
        if (startDate && endDate) {
            const parsed = parseDates(startDate, endDate);
            start = parsed.start;
            end = parsed.end;
        } else {
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 14);
            start.setHours(0, 0, 0, 0);
        }

        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all' && department !== 'All' && department.trim() !== '') {
            employeeQuery.department = { $regex: new RegExp(department.trim(), 'i') };
        }

        const employees = await Employee.find(employeeQuery).lean();
        const employeeIds = employees.map(e => e._id);

        const records = await Attendance.find({
            date: { $gte: start, $lte: end },
            employeeId: { $in: employeeIds }
        }).sort({ date: 1 }).lean();

        const trendMap = {};
        records.forEach(r => {
            const dateStr = new Date(r.date).toISOString().split('T')[0];
            if (!trendMap[dateStr]) {
                trendMap[dateStr] = {
                    date: dateStr,
                    present: 0,
                    absent: 0,
                    leave: 0,
                    late: 0
                };
            }
            const s = (r.status || '').toLowerCase();
            if (s === 'present') trendMap[dateStr].present++;
            else if (s === 'absent') trendMap[dateStr].absent++;
            else if (s === 'leave') trendMap[dateStr].leave++;
            else if (s === 'late' || s === 'abuse') trendMap[dateStr].late++;
        });

        // Ensure trend array is sorted chronologically
        const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({ success: true, data: trendData });
    } catch (error) {
        console.error('Error in getAttendanceTrend:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department attendance report
// @route   GET /api/attendance-reports/departments
const getDepartmentAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { start, end } = parseDates(startDate, endDate);

        const employees = await Employee.find({ status: { $ne: 'inactive' } }).lean();
        const departments = await Department.find({}).lean();

        const deptMap = {};
        // Initialize from departments collection
        departments.forEach(d => {
            deptMap[d.name] = {
                _id: d._id,
                departmentName: d.name,
                name: d.name,
                totalRecords: 0,
                present: 0,
                absent: 0,
                leave: 0,
                late: 0,
                attendanceRate: 0
            };
        });

        // Also ensure all employee departments are covered
        employees.forEach(e => {
            const dept = e.department || 'General';
            if (!deptMap[dept]) {
                deptMap[dept] = {
                    _id: dept,
                    departmentName: dept,
                    name: dept,
                    totalRecords: 0,
                    present: 0,
                    absent: 0,
                    leave: 0,
                    late: 0,
                    attendanceRate: 0
                };
            }
        });

        const records = await Attendance.find({
            date: { $gte: start, $lte: end },
            employeeId: { $in: employees.map(e => e._id) }
        }).populate('employeeId', 'department').lean();

        records.forEach(r => {
            const dept = r.employeeId?.department || 'General';
            if (!deptMap[dept]) {
                deptMap[dept] = {
                    _id: dept,
                    departmentName: dept,
                    name: dept,
                    totalRecords: 0,
                    present: 0,
                    absent: 0,
                    leave: 0,
                    late: 0,
                    attendanceRate: 0
                };
            }
            deptMap[dept].totalRecords++;
            const s = (r.status || '').toLowerCase();
            if (s === 'present') deptMap[dept].present++;
            else if (s === 'absent') deptMap[dept].absent++;
            else if (s === 'leave') deptMap[dept].leave++;
            else if (s === 'late' || s === 'abuse') deptMap[dept].late++;
        });

        const departmentReport = Object.values(deptMap).map(d => {
            const rate = d.totalRecords > 0 
                ? Math.round((d.present / d.totalRecords) * 100 * 10) / 10 
                : 0;
            return {
                ...d,
                attendanceRate: rate
            };
        });

        res.json({ success: true, data: departmentReport });
    } catch (error) {
        console.error('Error in getDepartmentAttendanceReport:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Export attendance report as CSV
// @route   GET /api/attendance-reports/export
const exportAttendanceReport = async (req, res) => {
    try {
        const { startDate, endDate, department, status, format = 'csv' } = req.query;
        const { start, end } = parseDates(startDate, endDate);

        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all' && department !== 'All' && department.trim() !== '') {
            employeeQuery.department = { $regex: new RegExp(department.trim(), 'i') };
        }

        const employees = await Employee.find(employeeQuery).lean();
        const employeeIds = employees.map(e => e._id);

        const records = await Attendance.find({
            date: { $gte: start, $lte: end },
            employeeId: { $in: employeeIds }
        }).lean();

        const recordsByEmp = {};
        employees.forEach(emp => { recordsByEmp[emp._id.toString()] = []; });
        records.forEach(rec => {
            const empIdStr = rec.employeeId?.toString();
            if (recordsByEmp[empIdStr]) recordsByEmp[empIdStr].push(rec);
        });

        const rows = employees.map((emp, idx) => {
            const empRecords = recordsByEmp[emp._id.toString()] || [];
            let present = 0, absent = 0, leave = 0, late = 0;
            empRecords.forEach(r => {
                const s = (r.status || '').toLowerCase();
                if (s === 'present') present++;
                else if (s === 'absent') absent++;
                else if (s === 'leave') leave++;
                else if (s === 'late' || s === 'abuse') late++;
            });
            const total = present + absent + leave + late;
            const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
            const empCode = emp.employeeCode || `EMP-${String(emp._id).slice(-4).toUpperCase()}`;

            return [
                idx + 1,
                `"${emp.name.replace(/"/g, '""')}"`,
                `"${empCode}"`,
                `"${(emp.department || '').replace(/"/g, '""')}"`,
                `"${(emp.position || '').replace(/"/g, '""')}"`,
                present,
                absent,
                leave,
                total,
                `"${rate}%"`
            ].join(',');
        });

        const csvHeader = 'Index,Employee Name,Employee ID,Department,Position,Present Days,Absent Days,Leave Days,Total Days,Attendance Rate\n';
        const csvContent = csvHeader + rows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.csv"`);
        return res.send(csvContent);
    } catch (error) {
        console.error('Error exporting attendance report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single attendance report (saved)
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

// @desc    Generate attendance report and persist to AttendanceReport model
// @route   POST /api/attendance-reports/generate
const generateAttendanceReport = async (req, res) => {
    try {
        const { title, reportType, startDate, endDate, department, employeeIds, notes } = req.body;
        const { start, end } = parseDates(startDate, endDate);

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
                case 'late':
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
            dailyDataMap[dateKey][record.status === 'late' ? 'abuse' : record.status] = 
                (dailyDataMap[dateKey][record.status === 'late' ? 'abuse' : record.status] || 0) + 1;
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

        const report = await AttendanceReport.create({
            title: title || `Attendance Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            reportType: reportType || 'custom',
            dateRange: { startDate: start, endDate: end },
            department: department || 'all',
            employeeIds: employeeIdList,
            summary,
            employeeWiseData,
            departmentWiseData: [],
            dailyData: Object.values(dailyDataMap),
            filters: { department, employeeIds },
            generatedBy: req.user._id || req.user.id,
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

module.exports = {
    getAttendanceReports,
    getAttendanceReportById,
    generateAttendanceReport,
    deleteAttendanceReport,
    getAttendanceSummary,
    getAttendanceTrend,
    getDepartmentAttendanceReport,
    exportAttendanceReport
};