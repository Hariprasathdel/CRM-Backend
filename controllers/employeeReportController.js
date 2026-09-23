const EmployeeReport = require('../models/employeeReport');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const mongoose = require('mongoose');

// @desc    Get all employee reports
// @route   GET /api/employee-reports
// @access  Private
const getEmployeeReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, reportType, status, search } = req.query;

        const query = {};
        if (reportType) query.reportType = reportType;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const reports = await EmployeeReport.find(query)
            .populate('generatedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await EmployeeReport.countDocuments(query);

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

// @desc    Get single employee report
// @route   GET /api/employee-reports/:id
// @access  Private
const getEmployeeReportById = async (req, res) => {
    try {
        const report = await EmployeeReport.findById(req.params.id)
            .populate('generatedBy', 'name email')
            .populate('employeeIds', 'name department position')
            .populate('employeeData.employeeId', 'name email department position');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Employee report not found'
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

// @desc    Generate employee report
// @route   POST /api/employee-reports/generate
// @access  Private (Admin only)
const generateEmployeeReport = async (req, res) => {
    try {
        const {
            title,
            reportType,
            startDate,
            endDate,
            department,
            employeeIds,
            status: filterStatus,
            gender,
            employmentType,
            notes
        } = req.body;

        // Validate dates
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
        if (department && department !== 'all') {
            employeeQuery.department = department;
        }
        if (employeeIds && employeeIds.length > 0) {
            employeeQuery._id = { $in: employeeIds };
        }
        if (filterStatus && filterStatus !== 'all') {
            employeeQuery.status = filterStatus;
        }
        if (gender && gender !== 'all') {
            employeeQuery.gender = gender;
        }

        // Get all employees
        const employees = await Employee.find(employeeQuery);

        // Initialize summary
        const summary = {
            totalEmployees: employees.length,
            activeEmployees: 0,
            inactiveEmployees: 0,
            onLeaveEmployees: 0,
            newHires: 0,
            terminated: 0,
            totalDepartments: 0,
            averageTenure: 0,
            averageAge: 0,
            maleCount: 0,
            femaleCount: 0,
            otherCount: 0,
            totalPayroll: 0,
            averageSalary: 0
        };

        // Calculations
        let totalTenure = 0;
        let totalAge = 0;
        let ageCount = 0;
        let totalSalary = 0;
        let salaryCount = 0;

        const departmentMap = {};
        const designationMap = {};
        const statusMap = {};
        const genderMap = {};
        const ageGroupMap = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 };
        const tenureGroupMap = { '0-1': 0, '1-3': 0, '3-5': 0, '5-10': 0, '10+': 0 };
        const hireTrendMap = {};

        // Process each employee
        const employeeData = employees.map(emp => {
            const now = new Date();
            const joinDate = new Date(emp.joinDate);
            const yearsOfService = Math.floor((now - joinDate) / (365.25 * 24 * 60 * 60 * 1000));
            const tenure = Math.round(((now - joinDate) / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;

            // Calculate age
            let age = null;
            if (emp.dateOfBirth) {
                age = Math.floor((now - new Date(emp.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
                totalAge += age;
                ageCount++;

                // Age group
                if (age >= 18 && age <= 25) ageGroupMap['18-25']++;
                else if (age >= 26 && age <= 35) ageGroupMap['26-35']++;
                else if (age >= 36 && age <= 45) ageGroupMap['36-45']++;
                else if (age >= 46 && age <= 55) ageGroupMap['46-55']++;
                else if (age >= 56) ageGroupMap['56+']++;
            }

            totalTenure += tenure;

            // Status counts
            if (emp.status === 'active') summary.activeEmployees++;
            else if (emp.status === 'inactive') summary.inactiveEmployees++;
            else if (emp.status === 'on_leave') summary.onLeaveEmployees++;

            // New hires (joined within date range)
            if (joinDate >= start && joinDate <= end) {
                summary.newHires++;
            }

            // Gender counts
            if (emp.gender === 'male') summary.maleCount++;
            else if (emp.gender === 'female') summary.femaleCount++;
            else if (emp.gender) summary.otherCount++;

            // Salary
            if (emp.salary) {
                totalSalary += emp.salary;
                salaryCount++;
                summary.totalPayroll += emp.salary;
            }

            // Department map
            if (!departmentMap[emp.department]) {
                departmentMap[emp.department] = {
                    department: emp.department,
                    totalEmployees: 0,
                    activeEmployees: 0,
                    inactiveEmployees: 0,
                    onLeaveEmployees: 0,
                    maleCount: 0,
                    femaleCount: 0,
                    totalAge: 0,
                    ageCount: 0,
                    totalSalary: 0,
                    salaryCount: 0,
                    totalPayroll: 0
                };
            }
            const dept = departmentMap[emp.department];
            dept.totalEmployees++;
            if (emp.status === 'active') dept.activeEmployees++;
            else if (emp.status === 'inactive') dept.inactiveEmployees++;
            else if (emp.status === 'on_leave') dept.onLeaveEmployees++;
            if (emp.gender === 'male') dept.maleCount++;
            else if (emp.gender === 'female') dept.femaleCount++;
            if (age) {
                dept.totalAge += age;
                dept.ageCount++;
            }
            if (emp.salary) {
                dept.totalSalary += emp.salary;
                dept.salaryCount++;
                dept.totalPayroll += emp.salary;
            }

            // Designation map
            if (!designationMap[emp.position]) {
                designationMap[emp.position] = {
                    position: emp.position,
                    count: 0,
                    department: emp.department,
                    totalSalary: 0,
                    salaryCount: 0
                };
            }
            designationMap[emp.position].count++;
            if (emp.salary) {
                designationMap[emp.position].totalSalary += emp.salary;
                designationMap[emp.position].salaryCount++;
            }

            // Status map
            statusMap[emp.status] = (statusMap[emp.status] || 0) + 1;

            // Gender map
            if (emp.gender) {
                genderMap[emp.gender] = (genderMap[emp.gender] || 0) + 1;
            }

            // Tenure group
            if (tenure >= 0 && tenure < 1) tenureGroupMap['0-1']++;
            else if (tenure >= 1 && tenure < 3) tenureGroupMap['1-3']++;
            else if (tenure >= 3 && tenure < 5) tenureGroupMap['3-5']++;
            else if (tenure >= 5 && tenure < 10) tenureGroupMap['5-10']++;
            else if (tenure >= 10) tenureGroupMap['10+']++;

            // Hire trend
            const hireYear = joinDate.getFullYear();
            const hireMonth = joinDate.getMonth() + 1;
            const trendKey = `${hireYear}-${String(hireMonth).padStart(2, '0')}`;
            if (!hireTrendMap[trendKey]) {
                hireTrendMap[trendKey] = {
                    year: hireYear,
                    month: hireMonth,
                    monthName: new Date(hireYear, hireMonth - 1).toLocaleString('default', { month: 'short' }),
                    hires: 0,
                    terminations: 0,
                    netChange: 0
                };
            }
            hireTrendMap[trendKey].hires++;

            return {
                employeeId: emp._id,
                employeeCode: `EMP-${String(emp._id).slice(-6).toUpperCase()}`,
                name: emp.name,
                email: emp.email,
                phone: emp.phone,
                department: emp.department,
                position: emp.position,
                status: emp.status,
                joinDate: emp.joinDate,
                dateOfBirth: emp.dateOfBirth,
                age,
                gender: emp.gender,
                address: emp.address,
                salary: emp.salary,
                tenure,
                yearsOfService,
                lastLogin: emp.lastLogin,
                createdAt: emp.createdAt
            };
        });

        // Calculate averages
        summary.averageTenure = employees.length > 0
            ? Math.round((totalTenure / employees.length) * 10) / 10
            : 0;
        summary.averageAge = ageCount > 0
            ? Math.round(totalAge / ageCount)
            : 0;
        summary.averageSalary = salaryCount > 0
            ? Math.round(totalSalary / salaryCount)
            : 0;
        summary.totalDepartments = Object.keys(departmentMap).length;

        // Build department-wise data
        const departmentWiseData = Object.values(departmentMap).map(dept => ({
            department: dept.department,
            totalEmployees: dept.totalEmployees,
            activeEmployees: dept.activeEmployees,
            inactiveEmployees: dept.inactiveEmployees,
            onLeaveEmployees: dept.onLeaveEmployees,
            maleCount: dept.maleCount,
            femaleCount: dept.femaleCount,
            averageAge: dept.ageCount > 0 ? Math.round(dept.totalAge / dept.ageCount) : 0,
            averageSalary: dept.salaryCount > 0 ? Math.round(dept.totalSalary / dept.salaryCount) : 0,
            totalPayroll: dept.totalPayroll
        }));

        // Build designation-wise data
        const designationWiseData = Object.values(designationMap).map(desig => ({
            position: desig.position,
            count: desig.count,
            department: desig.department,
            averageSalary: desig.salaryCount > 0
                ? Math.round(desig.totalSalary / desig.salaryCount)
                : 0
        }));

        // Build status-wise data
        const statusWiseData = Object.entries(statusMap).map(([status, count]) => ({
            status,
            count,
            percentage: employees.length > 0
                ? Math.round((count / employees.length) * 100 * 100) / 100
                : 0
        }));

        // Build gender-wise data
        const genderWiseData = Object.entries(genderMap).map(([gender, count]) => ({
            gender,
            count,
            percentage: employees.length > 0
                ? Math.round((count / employees.length) * 100 * 100) / 100
                : 0
        }));

        // Build age group-wise data
        const ageGroupWiseData = Object.entries(ageGroupMap).map(([ageGroup, count]) => ({
            ageGroup,
            count,
            percentage: employees.length > 0
                ? Math.round((count / employees.length) * 100 * 100) / 100
                : 0
        }));

        // Build tenure-wise data
        const tenureWiseData = Object.entries(tenureGroupMap).map(([tenureGroup, count]) => ({
            tenureGroup,
            count,
            percentage: employees.length > 0
                ? Math.round((count / employees.length) * 100 * 100) / 100
                : 0
        }));

        // Build hire trend data
        const hireTrendData = Object.values(hireTrendMap)
            .map(item => ({
                ...item,
                netChange: item.hires - item.terminations
            }))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // Create the report
        const report = await EmployeeReport.create({
            title: title || `Employee Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            reportType: reportType || 'summary',
            dateRange: { startDate: start, endDate: end },
            department: department || 'all',
            employeeIds: employees.map(e => e._id),
            filters: {
                status: filterStatus || 'all',
                gender: gender || 'all',
                employmentType: employmentType || 'all'
            },
            summary,
            employeeData,
            departmentWiseData,
            designationWiseData,
            statusWiseData,
            genderWiseData,
            ageGroupWiseData,
            tenureWiseData,
            hireTrendData,
            generatedBy: req.user.id,
            status: 'completed',
            notes
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'Employee report generated successfully'
        });
    } catch (error) {
        console.error('Error generating employee report:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete employee report
// @route   DELETE /api/employee-reports/:id
// @access  Private (Admin only)
const deleteEmployeeReport = async (req, res) => {
    try {
        const report = await EmployeeReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Employee report not found'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Employee report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get quick employee summary
// @route   GET /api/employee-reports/summary
// @access  Private
const getEmployeeSummary = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const query = {};
        if (department && department !== 'all') {
            query.department = department;
        }

        const employees = await Employee.find(query);

        const summary = {
            totalEmployees: employees.length,
            active: 0,
            inactive: 0,
            onLeave: 0,
            newHires: 0,
            departments: 0,
            maleCount: 0,
            femaleCount: 0,
            otherCount: 0,
            averageSalary: 0,
            totalPayroll: 0,
            dateRange: { startDate: start, endDate: end }
        };

        const departmentSet = new Set();
        let totalSalary = 0;
        let salaryCount = 0;

        employees.forEach(emp => {
            if (emp.status === 'active') summary.active++;
            else if (emp.status === 'inactive') summary.inactive++;
            else if (emp.status === 'on_leave') summary.onLeave++;

            const joinDate = new Date(emp.joinDate);
            if (joinDate >= start && joinDate <= end) summary.newHires++;

            if (emp.gender === 'male') summary.maleCount++;
            else if (emp.gender === 'female') summary.femaleCount++;
            else if (emp.gender) summary.otherCount++;

            if (emp.salary) {
                totalSalary += emp.salary;
                salaryCount++;
                summary.totalPayroll += emp.salary;
            }

            departmentSet.add(emp.department);
        });

        summary.departments = departmentSet.size;
        summary.averageSalary = salaryCount > 0
            ? Math.round(totalSalary / salaryCount)
            : 0;

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get employee growth trend
// @route   GET /api/employee-reports/trend
// @access  Private
const getEmployeeTrend = async (req, res) => {
    try {
        const { months = 12, department } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const query = {
            joinDate: { $gte: startDate, $lte: endDate }
        };

        if (department && department !== 'all') {
            query.department = department;
        }

        const hires = await Employee.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        year: { $year: '$joinDate' },
                        month: { $month: '$joinDate' }
                    },
                    hires: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Build complete month range
        const trendData = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            const year = current.getFullYear();
            const month = current.getMonth() + 1;
            const monthName = current.toLocaleString('default', { month: 'short' });

            const found = hires.find(h => h._id.year === year && h._id.month === month);

            trendData.push({
                year,
                month,
                monthName: `${monthName} ${year}`,
                hires: found ? found.hires : 0
            });

            current.setMonth(current.getMonth() + 1);
        }

        res.json({
            success: true,
            data: trendData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get department distribution
// @route   GET /api/employee-reports/department-distribution
// @access  Private
const getDepartmentDistribution = async (req, res) => {
    try {
        const distribution = await Employee.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0);

        const data = distribution.map(d => ({
            department: d._id,
            count: d.count,
            percentage: total > 0
                ? Math.round((d.count / total) * 100 * 100) / 100
                : 0
        }));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get gender distribution
// @route   GET /api/employee-reports/gender-distribution
// @access  Private
const getGenderDistribution = async (req, res) => {
    try {
        const distribution = await Employee.aggregate([
            {
                $match: {
                    gender: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0);

        const data = distribution.map(d => ({
            gender: d._id,
            count: d.count,
            percentage: total > 0
                ? Math.round((d.count / total) * 100 * 100) / 100
                : 0
        }));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get status distribution
// @route   GET /api/employee-reports/status-distribution
// @access  Private
const getStatusDistribution = async (req, res) => {
    try {
        const distribution = await Employee.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0);

        const data = distribution.map(d => ({
            status: d._id,
            count: d.count,
            percentage: total > 0
                ? Math.round((d.count / total) * 100 * 100) / 100
                : 0
        }));

        res.json({
            success: true,
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getEmployeeReports,
    getEmployeeReportById,
    generateEmployeeReport,
    deleteEmployeeReport,
    getEmployeeSummary,
    getEmployeeTrend,
    getDepartmentDistribution,
    getGenderDistribution,
    getStatusDistribution
};