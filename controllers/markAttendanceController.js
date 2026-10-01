const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Helper: Get today's date at midnight
const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

// Helper: Format time HH:MM
const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

// @desc    Quick check-in for current user
// @route   POST /api/mark-attendance/check-in
// @access  Private
const checkIn = async (req, res) => {
    try {
        const { employeeId, notes, location } = req.body;
        const targetEmployeeId = employeeId || req.user.id;

        // Verify employee exists
        const employee = await Employee.findById(targetEmployeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const today = getTodayDate();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if already checked in today
        const existingAttendance = await Attendance.findOne({
            employeeId: targetEmployeeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existingAttendance && existingAttendance.checkIn) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in today',
                data: existingAttendance
            });
        }

        const currentTime = formatTime(new Date());

        if (existingAttendance) {
            // Update existing record
            existingAttendance.status = 'present';
            existingAttendance.checkIn = currentTime;
            existingAttendance.notes = notes || existingAttendance.notes;
            if (location) existingAttendance.location = location;
            await existingAttendance.save();

            const populated = await Attendance.findById(existingAttendance._id)
                .populate('employeeId', 'name email department position profileImage');

            return res.json({
                success: true,
                data: populated,
                message: `Checked in at ${currentTime}`
            });
        }

        // Create new attendance record
        const attendance = await Attendance.create({
            employeeId: targetEmployeeId,
            status: 'present',
            checkIn: currentTime,
            date: new Date(),
            notes,
            location
        });

        const populated = await Attendance.findById(attendance._id)
            .populate('employeeId', 'name email department position profileImage');

        res.status(201).json({
            success: true,
            data: populated,
            message: `Checked in successfully at ${currentTime}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Quick check-out for current user
// @route   POST /api/mark-attendance/check-out
// @access  Private
const checkOut = async (req, res) => {
    try {
        const { employeeId, notes } = req.body;
        const targetEmployeeId = employeeId || req.user.id;

        const today = getTodayDate();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            employeeId: targetEmployeeId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'No check-in record found for today'
            });
        }

        if (!attendance.checkIn) {
            return res.status(400).json({
                success: false,
                message: 'Please check-in first'
            });
        }

        if (attendance.checkOut) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out today',
                data: attendance
            });
        }

        const currentTime = formatTime(new Date());
        attendance.checkOut = currentTime;
        if (notes) attendance.notes = notes;

        // Calculate work hours
        const [inHour, inMin] = attendance.checkIn.split(':').map(Number);
        const [outHour, outMin] = currentTime.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        const workHours = Math.round(((outMinutes - inMinutes) / 60) * 10) / 10;

        attendance.workHours = workHours;
        if (workHours > 8) {
            attendance.overtime = Math.round((workHours - 8) * 10) / 10;
        }

        await attendance.save();

        const populated = await Attendance.findById(attendance._id)
            .populate('employeeId', 'name email department position profileImage');

        res.json({
            success: true,
            data: populated,
            message: `Checked out at ${currentTime} (${workHours} hours worked)`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get today's attendance status for an employee
// @route   GET /api/mark-attendance/today/:employeeId
// @access  Private
const getTodayStatus = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const today = getTodayDate();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            employeeId,
            date: { $gte: today, $lt: tomorrow }
        }).populate('employeeId', 'name email department position profileImage');

        if (!attendance) {
            return res.json({
                success: true,
                data: {
                    status: 'not_marked',
                    canCheckIn: true,
                    canCheckOut: false,
                    message: 'Not checked in yet today'
                }
            });
        }

        const canCheckIn = !attendance.checkIn;
        const canCheckOut = attendance.checkIn && !attendance.checkOut;

        res.json({
            success: true,
            data: {
                ...attendance.toObject(),
                canCheckIn,
                canCheckOut,
                message: attendance.checkOut
                    ? 'Completed for today'
                    : attendance.checkIn
                    ? 'Currently checked in'
                    : 'Attendance marked'
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk mark attendance for multiple employees
// @route   POST /api/mark-attendance/bulk
// @access  Private (Admin only)
const bulkMarkAttendance = async (req, res) => {
    try {
        const { date, attendanceList, department } = req.body;

        if (!attendanceList || !Array.isArray(attendanceList) || attendanceList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance list is required'
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const results = {
            created: [],
            updated: [],
            failed: [],
            total: attendanceList.length
        };

        for (const record of attendanceList) {
            try {
                const { employeeId, status, checkIn, checkOut, overtime, notes } = record;

                // Verify employee exists
                const employee = await Employee.findById(employeeId);
                if (!employee) {
                    results.failed.push({
                        employeeId,
                        reason: 'Employee not found'
                    });
                    continue;
                }

                // Check if attendance exists
                const existing = await Attendance.findOne({
                    employeeId,
                    date: { $gte: targetDate, $lt: nextDay }
                });

                const attendanceData = {
                    employeeId,
                    status: status || 'present',
                    checkIn: checkIn || null,
                    checkOut: checkOut || null,
                    overtime: overtime || 0,
                    notes: notes || '',
                    date: targetDate
                };

                if (existing) {
                    // Update
                    Object.assign(existing, attendanceData);
                    await existing.save();
                    results.updated.push({
                        employeeId,
                        employeeName: employee.name,
                        status
                    });
                } else {
                    // Create
                    const created = await Attendance.create(attendanceData);
                    results.created.push({
                        employeeId,
                        employeeName: employee.name,
                        status
                    });
                }
            } catch (err) {
                results.failed.push({
                    employeeId: record.employeeId,
                    reason: err.message
                });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Bulk attendance processed: ${results.created.length} created, ${results.updated.length} updated, ${results.failed.length} failed`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark all employees as present (quick action)
// @route   POST /api/mark-attendance/mark-all-present
// @access  Private (Admin only)
const markAllPresent = async (req, res) => {
    try {
        const { date, department, excludeEmployeeIds } = req.body;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Build employee query
        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all') {
            employeeQuery.department = department;
        }
        if (excludeEmployeeIds && excludeEmployeeIds.length > 0) {
            employeeQuery._id = { $nin: excludeEmployeeIds };
        }

        const employees = await Employee.find(employeeQuery);
        const employeeIdList = employees.map(e => e._id);

        // Get existing attendance records
        const existingRecords = await Attendance.find({
            employeeId: { $in: employeeIdList },
            date: { $gte: targetDate, $lt: nextDay }
        });

        const existingMap = {};
        existingRecords.forEach(r => {
            existingMap[r.employeeId.toString()] = r;
        });

        const currentTime = formatTime(new Date());
        let created = 0;
        let skipped = 0;

        const bulkOps = [];

        for (const employee of employees) {
            const existing = existingMap[employee._id.toString()];

            if (existing) {
                // Skip if already marked with real status
                if (existing.checkIn || existing.status !== 'absent') {
                    skipped++;
                    continue;
                }
                // Update if it was just 'absent' default
                bulkOps.push({
                    updateOne: {
                        filter: { _id: existing._id },
                        update: {
                            $set: {
                                status: 'present',
                                checkIn: existing.checkIn || currentTime
                            }
                        }
                    }
                });
            } else {
                bulkOps.push({
                    insertOne: {
                        document: {
                            employeeId: employee._id,
                            status: 'present',
                            checkIn: currentTime,
                            date: targetDate,
                            overtime: 0
                        }
                    }
                });
            }
            created++;
        }

        if (bulkOps.length > 0) {
            await Attendance.bulkWrite(bulkOps);
        }

        res.json({
            success: true,
            data: {
                total: employees.length,
                marked: created,
                skipped
            },
            message: `${created} employees marked as present`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark specific status for employees
// @route   POST /api/mark-attendance/bulk-status
// @access  Private (Admin only)
const bulkUpdateStatus = async (req, res) => {
    try {
        const { employeeIds, status, date, notes } = req.body;

        if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Employee IDs are required'
            });
        }

        if (!status || !['present', 'absent', 'leave', 'abuse'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Verify all employees exist
        const employees = await Employee.find({ _id: { $in: employeeIds } });
        const validIds = employees.map(e => e._id.toString());
        const invalidIds = employeeIds.filter(id => !validIds.includes(id.toString()));

        // Get existing attendance records
        const existingRecords = await Attendance.find({
            employeeId: { $in: employeeIds },
            date: { $gte: targetDate, $lt: nextDay }
        });

        const existingMap = {};
        existingRecords.forEach(r => {
            existingMap[r.employeeId.toString()] = r;
        });

        const results = {
            updated: [],
            created: [],
            failed: invalidIds.map(id => ({
                employeeId: id,
                reason: 'Employee not found'
            }))
        };

        for (const employee of employees) {
            const existing = existingMap[employee._id.toString()];

            if (existing) {
                existing.status = status;
                if (notes) existing.notes = notes;
                await existing.save();
                results.updated.push({
                    employeeId: employee._id,
                    employeeName: employee.name
                });
            } else {
                const created = await Attendance.create({
                    employeeId: employee._id,
                    status,
                    date: targetDate,
                    notes: notes || ''
                });
                results.created.push({
                    employeeId: employee._id,
                    employeeName: employee.name
                });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `${results.created.length + results.updated.length} employees marked as ${status}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get unmarked employees for a date
// @route   GET /api/mark-attendance/unmarked
// @access  Private
const getUnmarkedEmployees = async (req, res) => {
    try {
        const { date, department } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get all active employees
        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all') {
            employeeQuery.department = department;
        }

        const allEmployees = await Employee.find(employeeQuery);

        // Get employees with attendance records
        const attendanceRecords = await Attendance.find({
            date: { $gte: targetDate, $lt: nextDay }
        }).select('employeeId status');

        const markedEmployeeIds = attendanceRecords.map(r => r.employeeId.toString());

        // Find unmarked employees
        const unmarkedEmployees = allEmployees.filter(
            e => !markedEmployeeIds.includes(e._id.toString())
        );

        res.json({
            success: true,
            data: {
                date: targetDate,
                totalEmployees: allEmployees.length,
                marked: markedEmployeeIds.length,
                unmarked: unmarkedEmployees.length,
                unmarkedEmployees: unmarkedEmployees.map(e => ({
                    _id: e._id,
                    name: e.name,
                    email: e.email,
                    department: e.department,
                    position: e.position,
                    profileImage: e.profileImage
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get today's attendance overview
// @route   GET /api/mark-attendance/overview
// @access  Private
const getTodayOverview = async (req, res) => {
    try {
        const { date, department } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get all active employees
        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all') {
            employeeQuery.department = department;
        }

        const totalEmployees = await Employee.countDocuments(employeeQuery);

        // Get attendance stats
        const stats = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: targetDate, $lt: nextDay }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusCounts = {
            present: 0,
            absent: 0,
            leave: 0,
            abuse: 0
        };

        stats.forEach(s => {
            if (statusCounts[s._id] !== undefined) {
                statusCounts[s._id] = s.count;
            }
        });

        const totalMarked = Object.values(statusCounts).reduce((a, b) => a + b, 0);
        const unmarked = totalEmployees - totalMarked;

        // Get recent check-ins
        const recentCheckIns = await Attendance.find({
            date: { $gte: targetDate, $lt: nextDay },
            checkIn: { $ne: null }
        })
            .populate('employeeId', 'name department position profileImage')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json({
            success: true,
            data: {
                date: targetDate,
                totalEmployees,
                marked: totalMarked,
                unmarked,
                statusCounts,
                presentPercentage: totalEmployees > 0
                    ? Math.round((statusCounts.present / totalEmployees) * 100)
                    : 0,
                recentCheckIns
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset attendance for a date (undo)
// @route   DELETE /api/mark-attendance/reset
// @access  Private (Admin only)
const resetAttendance = async (req, res) => {
    try {
        const { date, employeeIds, department } = req.body;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const query = {
            date: { $gte: targetDate, $lt: nextDay }
        };

        if (employeeIds && employeeIds.length > 0) {
            query.employeeId = { $in: employeeIds };
        } else if (department && department !== 'all') {
            const employees = await Employee.find({ department });
            query.employeeId = { $in: employees.map(e => e._id) };
        }

        const result = await Attendance.deleteMany(query);

        res.json({
            success: true,
            data: {
                deletedCount: result.deletedCount,
                date: targetDate
            },
            message: `Reset ${result.deletedCount} attendance records`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark single employee attendance
// @route   POST /api/mark-attendance/single
// @access  Private
const markSingleAttendance = async (req, res) => {
    try {
        const { employeeId, status, checkIn, checkOut, overtime, notes, date } = req.body;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required'
            });
        }

        if (!status || !['present', 'absent', 'leave', 'abuse'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        // Verify employee
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Check existing
        const existing = await Attendance.findOne({
            employeeId,
            date: { $gte: targetDate, $lt: nextDay }
        });

        const attendanceData = {
            employeeId,
            status,
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            overtime: overtime || 0,
            notes: notes || '',
            date: targetDate
        };

        let attendance;
        let action;

        if (existing) {
            Object.assign(existing, attendanceData);
            attendance = await existing.save();
            action = 'updated';
        } else {
            attendance = await Attendance.create(attendanceData);
            action = 'created';
        }

        const populated = await Attendance.findById(attendance._id)
            .populate('employeeId', 'name email department position profileImage');

        res.status(existing ? 200 : 201).json({
            success: true,
            data: populated,
            message: `Attendance ${action} for ${employee.name}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get employees with attendance status for a date
// @route   GET /api/mark-attendance/employees-with-status
// @access  Private
const getEmployeesWithStatus = async (req, res) => {
    try {
        const { date, department, status: filterStatus, search } = req.query;

        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Build employee query
        const employeeQuery = { status: { $ne: 'inactive' } };
        if (department && department !== 'all') {
            employeeQuery.department = department;
        }
        if (search) {
            employeeQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employeeCode: { $regex: search, $options: 'i' } }
            ];
        }

        const employees = await Employee.find(employeeQuery)
            .select('name email department position profileImage employeeCode')
            .sort({ name: 1 });

        // Get attendance for the date
        const attendanceRecords = await Attendance.find({
            employeeId: { $in: employees.map(e => e._id) },
            date: { $gte: targetDate, $lt: nextDay }
        });

        const attendanceMap = {};
        attendanceRecords.forEach(r => {
            attendanceMap[r.employeeId.toString()] = r;
        });

        // Merge employee + attendance data
        let result = employees.map(emp => {
            const attendance = attendanceMap[emp._id.toString()];
            return {
                _id: emp._id,
                name: emp.name,
                email: emp.email,
                employeeCode: emp.employeeCode || `EMP-${String(emp._id).slice(-6).toUpperCase()}`,
                department: emp.department,
                position: emp.position,
                profileImage: emp.profileImage,
                attendance: attendance ? {
                    _id: attendance._id,
                    status: attendance.status,
                    checkIn: attendance.checkIn,
                    checkOut: attendance.checkOut,
                    overtime: attendance.overtime,
                    workHours: attendance.workHours,
                    notes: attendance.notes
                } : {
                    status: 'not_marked',
                    checkIn: null,
                    checkOut: null,
                    overtime: 0
                }
            };
        });

        // Filter by status if provided
        if (filterStatus && filterStatus !== 'all') {
            result = result.filter(r => r.attendance.status === filterStatus);
        }

        res.json({
            success: true,
            data: result,
            date: targetDate,
            total: result.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayStatus,
    bulkMarkAttendance,
    markAllPresent,
    bulkUpdateStatus,
    getUnmarkedEmployees,
    getTodayOverview,
    resetAttendance,
    markSingleAttendance,
    getEmployeesWithStatus
};