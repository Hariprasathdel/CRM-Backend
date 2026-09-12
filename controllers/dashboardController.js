const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Award = require('../models/Award');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments({ status: 'active' });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's attendance stats
        const attendanceStats = await Attendance.aggregate([
            {
                $match: {
                    date: { $gte: today, $lt: tomorrow }
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Recent leaves
        const recentLeaves = await Leave.find()
            .sort({ createdAt: -1 })
            .limit(4);

        // Recent awards
        const recentAwards = await Award.find()
            .sort({ date: -1 })
            .limit(3);

        // Employee count growth (last 7 days)
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const employeeGrowth = await Employee.find({
            createdAt: { $gte: sevenDaysAgo }
        });

        const attendanceData = {
            present: 0,
            absent: 0,
            leave: 0,
            abuse: 0
        };

        attendanceStats.forEach(stat => {
            if (stat._id === 'present') attendanceData.present = stat.count;
            if (stat._id === 'absent') attendanceData.absent = stat.count;
            if (stat._id === 'leave') attendanceData.leave = stat.count;
            if (stat._id === 'abuse') attendanceData.abuse = stat.count;
        });

        const totalToday = attendanceData.present + attendanceData.absent + 
                          attendanceData.leave + attendanceData.abuse;

        const presentPercentage = totalToday > 0 ? 
            Math.round((attendanceData.present / totalToday) * 100) : 0;
        const absentPercentage = totalToday > 0 ? 
            Math.round((attendanceData.absent / totalToday) * 100) : 0;
        const leavePercentage = totalToday > 0 ? 
            Math.round((attendanceData.leave / totalToday) * 100) : 0;

        res.json({
            totalEmployees,
            employeeGrowth: {
                count: employeeGrowth.length,
                percentage: totalEmployees > 0 ? 
                    Math.round((employeeGrowth.length / (totalEmployees - employeeGrowth.length + 1)) * 100) : 0,
                message: `Employee count grew the last 7 days, from ${totalEmployees - employeeGrowth.length} to ${totalEmployees}`
            },
            attendance: {
                present: presentPercentage,
                absent: absentPercentage,
                leave: leavePercentage,
                presentCount: attendanceData.present,
                absentCount: attendanceData.absent,
                leaveCount: attendanceData.leave,
                abuseCount: attendanceData.abuse,
                total: totalToday,
                totalEmployees
            },
            recentLeaves,
            recentAwards,
            notices: [
                {
                    title: 'Get ready for meeting at 6 pm',
                    type: 'Meeting',
                    date: '22-Aug-26'
                }
            ],
            managementDecisions: [
                {
                    title: 'Immediate Management Meeting',
                    date: '11-Jul-26'
                },
                {
                    title: 'Our Organization will Organize an Annual Report',
                    type: 'Meeting',
                    date: '10-Jul-26'
                }
            ]
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardStats
};
