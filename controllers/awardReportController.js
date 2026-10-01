const AwardReport = require('../models/AwardReport');
const Award = require('../models/Award');
const Employee = require('../models/Employee');

// Helper: Get month name
const getMonthName = (month) => {
    return new Date(2024, month - 1, 1).toLocaleString('default', { month: 'short' });
};

// Helper: Get quarter from month
const getQuarter = (month) => {
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
};

// @desc    Get all award reports
// @route   GET /api/award-reports
// @access  Private
const getAwardReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, reportType, status, search } = req.query;

        const query = {};
        if (reportType) query.reportType = reportType;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const reports = await AwardReport.find(query)
            .populate('generatedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await AwardReport.countDocuments(query);

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

// @desc    Get single award report
// @route   GET /api/award-reports/:id
// @access  Private
const getAwardReportById = async (req, res) => {
    try {
        const report = await AwardReport.findById(req.params.id)
            .populate('generatedBy', 'name email')
            .populate('employeeIds', 'name department position')
            .populate('awardData.employeeId', 'name email department position')
            .populate('awardData.awardId');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Award report not found'
            });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate award report
// @route   POST /api/award-reports/generate
// @access  Private (Admin only)
const generateAwardReport = async (req, res) => {
    try {
        const {
            title,
            reportType,
            startDate,
            endDate,
            department,
            employeeIds,
            awardType,
            notes
        } = req.body;

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be before end date'
            });
        }

        // Build employee query
        const employeeQuery = {};
        if (department && department !== 'all') employeeQuery.department = department;
        if (employeeIds && employeeIds.length > 0) employeeQuery._id = { $in: employeeIds };

        const employees = await Employee.find(employeeQuery);
        const employeeIdList = employees.map(e => e._id);

        // Build award query
        const awardQuery = {
            date: { $gte: start, $lte: end }
        };

        if (employeeIdList.length > 0) {
            awardQuery.employeeId = { $in: employeeIdList };
        }
        if (awardType && awardType !== 'all') {
            awardQuery.type = awardType;
        }

        // Get awards with populated employee data
        const awards = await Award.find(awardQuery)
            .populate('employeeId', 'name email department position')
            .sort({ date: -1 });

        // Initialize summary
        const summary = {
            totalAwards: awards.length,
            totalEmployeesAwarded: 0,
            totalAmount: 0,
            averageAwardAmount: 0,
            uniqueDepartments: 0,
            topPerformer: null,
            topDepartment: null,
            awardsByType: {
                gascapitol: 0,
                coby_beach: 0,
                best_employee: 0,
                innovation: 0,
                leadership: 0,
                team_player: 0,
                other: 0
            }
        };

        const departmentMap = {};
        const employeeMap = {};
        const awardTypeMap = {};
        const monthlyMap = {};
        const quarterlyMap = {};
        const uniqueDepartmentsSet = new Set();

        const awardData = awards.map(award => {
            const emp = award.employeeId;
            const awardDate = new Date(award.date);
            const year = awardDate.getFullYear();
            const month = awardDate.getMonth() + 1;
            const monthName = getMonthName(month);
            const quarter = getQuarter(month);

            // Update summary
            if (award.amount && award.amount > 0) {
                summary.totalAmount += award.amount;
            }

            // Count by type
            if (summary.awardsByType[award.type] !== undefined) {
                summary.awardsByType[award.type]++;
            } else {
                summary.awardsByType.other++;
            }

            // Department aggregation
            const deptName = emp?.department || 'Unknown';
            uniqueDepartmentsSet.add(deptName);
            if (!departmentMap[deptName]) {
                departmentMap[deptName] = {
                    department: deptName,
                    totalAwards: 0,
                    totalAmount: 0,
                    employees: new Set(),
                    typeCount: {}
                };
            }
            const dept = departmentMap[deptName];
            dept.totalAwards++;
            if (award.amount) dept.totalAmount += award.amount;
            if (emp) dept.employees.add(emp._id.toString());
            dept.typeCount[award.type] = (dept.typeCount[award.type] || 0) + 1;

            // Employee aggregation
            if (emp) {
                const empId = emp._id.toString();
                if (!employeeMap[empId]) {
                    employeeMap[empId] = {
                        employeeId: emp._id,
                        employeeCode: `EMP-${String(emp._id).slice(-6).toUpperCase()}`,
                        employeeName: emp.name,
                        department: emp.department,
                        totalAwards: 0,
                        totalAmount: 0,
                        awardTypes: new Set(),
                        lastAwardDate: null
                    };
                }
                const empRecord = employeeMap[empId];
                empRecord.totalAwards++;
                if (award.amount) empRecord.totalAmount += award.amount;
                empRecord.awardTypes.add(award.type);
                if (!empRecord.lastAwardDate || awardDate > empRecord.lastAwardDate) {
                    empRecord.lastAwardDate = awardDate;
                }
            }

            // Award type aggregation
            if (!awardTypeMap[award.type]) {
                awardTypeMap[award.type] = { count: 0, totalAmount: 0 };
            }
            awardTypeMap[award.type].count++;
            if (award.amount) awardTypeMap[award.type].totalAmount += award.amount;

            // Monthly trend
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                    year,
                    month,
                    monthName,
                    count: 0,
                    totalAmount: 0
                };
            }
            monthlyMap[monthKey].count++;
            if (award.amount) monthlyMap[monthKey].totalAmount += award.amount;

            // Quarterly aggregation
            const quarterKey = `${year}-${quarter}`;
            if (!quarterlyMap[quarterKey]) {
                quarterlyMap[quarterKey] = {
                    year,
                    quarter,
                    count: 0,
                    totalAmount: 0
                };
            }
            quarterlyMap[quarterKey].count++;
            if (award.amount) quarterlyMap[quarterKey].totalAmount += award.amount;

            return {
                awardId: award._id,
                employeeId: emp?._id,
                employeeCode: emp ? `EMP-${String(emp._id).slice(-6).toUpperCase()}` : 'N/A',
                employeeName: emp?.name || award.employeeName || 'N/A',
                department: emp?.department || award.department || 'N/A',
                position: emp?.position || 'N/A',
                awardName: award.awardName,
                awardType: award.type,
                awardDate: award.date,
                amount: award.amount,
                description: award.description,
                presentedBy: award.presentedBy,
                year,
                month,
                monthName,
                quarter
            };
        });

        // Calculate summary metrics
        summary.totalEmployeesAwarded = Object.keys(employeeMap).length;
        summary.uniqueDepartments = uniqueDepartmentsSet.size;
        summary.averageAwardAmount = awards.length > 0
            ? Math.round(summary.totalAmount / awards.length)
            : 0;

        // Find top performer
        const employeeList = Object.values(employeeMap);
        if (employeeList.length > 0) {
            const topPerformer = employeeList.reduce((max, emp) =>
                emp.totalAwards > max.totalAwards ? emp : max
            );
            summary.topPerformer = topPerformer.employeeName;
        }

        // Find top department
        const departmentList = Object.values(departmentMap);
        if (departmentList.length > 0) {
            const topDept = departmentList.reduce((max, dept) =>
                dept.totalAwards > max.totalAwards ? dept : max
            );
            summary.topDepartment = topDept.department;
        }

        // Build department-wise data
        const departmentWiseData = Object.values(departmentMap).map(dept => {
            // Find most common award type
            let topAwardType = 'N/A';
            let maxCount = 0;
            Object.entries(dept.typeCount).forEach(([type, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topAwardType = type;
                }
            });

            return {
                department: dept.department,
                totalAwards: dept.totalAwards,
                totalAmount: dept.totalAmount,
                uniqueEmployees: dept.employees.size,
                averageAmount: dept.totalAwards > 0
                    ? Math.round(dept.totalAmount / dept.totalAwards)
                    : 0,
                topAwardType
            };
        }).sort((a, b) => b.totalAwards - a.totalAwards);

        // Build employee-wise data
        const employeeWiseData = Object.values(employeeMap).map(emp => ({
            employeeId: emp.employeeId,
            employeeCode: emp.employeeCode,
            employeeName: emp.employeeName,
            department: emp.department,
            totalAwards: emp.totalAwards,
            totalAmount: emp.totalAmount,
            awardTypes: Array.from(emp.awardTypes),
            lastAwardDate: emp.lastAwardDate
        })).sort((a, b) => b.totalAwards - a.totalAwards);

        // Build award type-wise data
        const awardTypeWiseData = Object.entries(awardTypeMap).map(([type, data]) => ({
            awardType: type,
            count: data.count,
            totalAmount: data.totalAmount,
            percentage: awards.length > 0
                ? Math.round((data.count / awards.length) * 100 * 100) / 100
                : 0
        })).sort((a, b) => b.count - a.count);

        // Build monthly trend data
        const monthlyTrendData = Object.values(monthlyMap).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Build quarterly data
        const quarterlyData = Object.values(quarterlyMap).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.quarter.localeCompare(b.quarter);
        });

        // Build top performers data (top 10)
        const topPerformersData = employeeWiseData.slice(0, 10);

        // Create the report
        const report = await AwardReport.create({
            title: title || `Award Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            reportType: reportType || 'summary',
            dateRange: { startDate: start, endDate: end },
            department: department || 'all',
            employeeIds: employeeIdList,
            awardIds: awards.map(a => a._id),
            filters: {
                awardType: awardType || 'all'
            },
            summary,
            awardData,
            departmentWiseData,
            employeeWiseData,
            awardTypeWiseData,
            monthlyTrendData,
            quarterlyData,
            topPerformersData,
            generatedBy: req.user.id,
            status: 'completed',
            notes
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'Award report generated successfully'
        });
    } catch (error) {
        console.error('Error generating award report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete award report
// @route   DELETE /api/award-reports/:id
// @access  Private (Admin only)
const deleteAwardReport = async (req, res) => {
    try {
        const report = await AwardReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Award report not found'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Award report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get quick award summary
// @route   GET /api/award-reports/summary
// @access  Private
const getAwardSummary = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const employeeQuery = {};
        if (department && department !== 'all') employeeQuery.department = department;

        const employees = await Employee.find(employeeQuery);
        const employeeIdList = employees.map(e => e._id);

        const awardQuery = {
            date: { $gte: start, $lte: end }
        };
        if (employeeIdList.length > 0) awardQuery.employeeId = { $in: employeeIdList };

        const awards = await Award.find(awardQuery)
            .populate('employeeId', 'department');

        const summary = {
            totalAwards: awards.length,
            totalAmount: 0,
            uniqueEmployees: new Set(),
            departments: new Set(),
            awardsByType: {
                gascapitol: 0,
                coby_beach: 0,
                best_employee: 0,
                innovation: 0,
                leadership: 0,
                team_player: 0,
                other: 0
            },
            dateRange: { startDate: start, endDate: end }
        };

        awards.forEach(award => {
            if (award.amount) summary.totalAmount += award.amount;

            if (award.employeeId) {
                summary.uniqueEmployees.add(award.employeeId._id.toString());
                if (award.employeeId.department) {
                    summary.departments.add(award.employeeId.department);
                }
            }

            if (summary.awardsByType[award.type] !== undefined) {
                summary.awardsByType[award.type]++;
            } else {
                summary.awardsByType.other++;
            }
        });

        summary.uniqueEmployees = summary.uniqueEmployees.size;
        summary.uniqueDepartments = summary.departments.size;
        summary.averageAwardAmount = awards.length > 0
            ? Math.round(summary.totalAmount / awards.length)
            : 0;
        delete summary.departments;

        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get award trend
// @route   GET /api/award-reports/trend
// @access  Private
const getAwardTrend = async (req, res) => {
    try {
        const { months = 12, department } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const awardQuery = {
            date: { $gte: startDate, $lte: endDate }
        };

        if (department && department !== 'all') {
            const employees = await Employee.find({ department });
            awardQuery.employeeId = { $in: employees.map(e => e._id) };
        }

        const awards = await Award.find(awardQuery).sort({ date: 1 });

        const trendMap = {};

        // Initialize all months
        const current = new Date(startDate);
        while (current <= endDate) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            trendMap[key] = {
                year: current.getFullYear(),
                month: current.getMonth() + 1,
                monthName: current.toLocaleString('default', { month: 'short' }),
                count: 0,
                totalAmount: 0
            };
            current.setMonth(current.getMonth() + 1);
        }

        awards.forEach(award => {
            const awardDate = new Date(award.date);
            const key = `${awardDate.getFullYear()}-${String(awardDate.getMonth() + 1).padStart(2, '0')}`;

            if (trendMap[key]) {
                trendMap[key].count++;
                if (award.amount) trendMap[key].totalAmount += award.amount;
            }
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

// @desc    Get award type distribution
// @route   GET /api/award-reports/type-distribution
// @access  Private
const getAwardTypeDistribution = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const distribution = await Award.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0);

        const data = distribution.map(d => ({
            awardType: d._id,
            count: d.count,
            totalAmount: d.totalAmount,
            percentage: total > 0
                ? Math.round((d.count / total) * 100 * 100) / 100
                : 0
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get top performers
// @route   GET /api/award-reports/top-performers
// @access  Private
const getTopPerformers = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate, department } = req.query;

        const query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        if (department && department !== 'all') {
            const employees = await Employee.find({ department });
            query.employeeId = { $in: employees.map(e => e._id) };
        }

        const performers = await Award.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$employeeId',
                    employeeName: { $first: '$employeeName' },
                    department: { $first: '$department' },
                    awardsCount: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { awardsCount: -1, totalAmount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'employees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } }
        ]);

        const data = performers.map(p => ({
            employeeId: p._id,
            employeeCode: `EMP-${String(p._id).slice(-6).toUpperCase()}`,
            employeeName: p.employee?.name || p.employeeName,
            department: p.employee?.department || p.department,
            position: p.employee?.position,
            awardsCount: p.awardsCount,
            totalAmount: p.totalAmount
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get recent awards
// @route   GET /api/award-reports/recent
// @access  Private
const getRecentAwards = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const awards = await Award.find()
            .populate('employeeId', 'name email department position profileImage')
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json({ success: true, data: awards });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department performance
// @route   GET /api/award-reports/department-performance
// @access  Private
const getDepartmentPerformance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const query = {};
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const performance = await Award.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'employees',
                    localField: 'employeeId',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$employee.department',
                    totalAwards: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    uniqueEmployees: { $addToSet: '$employeeId' }
                }
            },
            {
                $project: {
                    department: '$_id',
                    totalAwards: 1,
                    totalAmount: 1,
                    uniqueEmployees: { $size: '$uniqueEmployees' }
                }
            },
            { $sort: { totalAwards: -1 } }
        ]);

        res.json({ success: true, data: performance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAwardReports,
    getAwardReportById,
    generateAwardReport,
    deleteAwardReport,
    getAwardSummary,
    getAwardTrend,
    getAwardTypeDistribution,
    getTopPerformers,
    getRecentAwards,
    getDepartmentPerformance
};