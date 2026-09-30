const LoanReport = require('../models/LoanReport');
const Loan = require('../models/Loan');
const Employee = require('../models/Employee');

// @desc    Get all loan reports
// @route   GET /api/loan-reports
// @access  Private
const getLoanReports = async (req, res) => {
    try {
        const { page = 1, limit = 10, reportType, status, search } = req.query;

        const query = {};
        if (reportType) query.reportType = reportType;
        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: 'i' };

        const reports = await LoanReport.find(query)
            .populate('generatedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await LoanReport.countDocuments(query);

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

// @desc    Get single loan report
// @route   GET /api/loan-reports/:id
// @access  Private
const getLoanReportById = async (req, res) => {
    try {
        const report = await LoanReport.findById(req.params.id)
            .populate('generatedBy', 'name email')
            .populate('loanIds')
            .populate('loanData.loanId')
            .populate('loanData.employeeId', 'name email department position');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Loan report not found'
            });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Generate loan report
// @route   POST /api/loan-reports/generate
// @access  Private (Admin only)
const generateLoanReport = async (req, res) => {
    try {
        const {
            title,
            reportType,
            startDate,
            endDate,
            department,
            employeeIds,
            status: filterStatus,
            minAmount,
            maxAmount,
            paymentMethod,
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

        // Build loan query
        const loanQuery = {
            startDate: { $gte: start, $lte: end }
        };

        if (employeeIdList.length > 0) {
            loanQuery.employeeId = { $in: employeeIdList };
        }
        if (filterStatus && filterStatus !== 'all') {
            loanQuery.status = filterStatus;
        }
        if (minAmount) loanQuery.amount = { $gte: minAmount };
        if (maxAmount) {
            loanQuery.amount = { ...loanQuery.amount, $lte: maxAmount };
        }
        if (paymentMethod && paymentMethod !== 'all') {
            loanQuery.paymentMethod = paymentMethod;
        }

        // Get loans with populated employee data
        const loans = await Loan.find(loanQuery)
            .populate('employeeId', 'name email department position');

        // Initialize summary
        const summary = {
            totalLoans: loans.length,
            totalLoanAmount: 0,
            totalDisbursed: 0,
            totalRepaid: 0,
            totalOutstanding: 0,
            totalInterest: 0,
            activeLoans: 0,
            paidLoans: 0,
            defaultedLoans: 0,
            pendingLoans: 0,
            overdueLoans: 0,
            averageLoanAmount: 0,
            averageInterestRate: 0,
            averageTenure: 0,
            recoveryRate: 0
        };

        const departmentMap = {};
        const statusMap = {};
        const monthlyTrendMap = {};
        const borrowerMap = {};
        const now = new Date();

        let totalInterest = 0;
        let totalInterestRate = 0;
        let totalTenure = 0;

        const loanData = loans.map(loan => {
            const emp = loan.employeeId;
            const loanAmount = loan.amount || 0;
            const interestRate = loan.interestRate || 0;
            const tenure = loan.tenure || 0;
            const totalPaid = loan.totalPaid || 0;
            const remainingAmount = Math.max(0, loanAmount - totalPaid);

            // Calculate total repayment and interest
            const monthlyInstallment = loan.monthlyInstallment || 0;
            const totalRepayment = monthlyInstallment * tenure;
            const interest = totalRepayment - loanAmount;

            // Calculate progress percentage
            const progressPercentage = loanAmount > 0
                ? Math.round((totalPaid / loanAmount) * 100 * 100) / 100
                : 0;

            // Calculate days overdue
            let daysOverdue = 0;
            const loanEndDate = loan.endDate ? new Date(loan.endDate) : null;
            if (loanEndDate && now > loanEndDate && loan.status === 'active') {
                daysOverdue = Math.ceil((now - loanEndDate) / (1000 * 60 * 60 * 24));
            }

            // Update summary
            summary.totalLoanAmount += loanAmount;
            summary.totalRepaid += totalPaid;
            summary.totalOutstanding += remainingAmount;

            if (interest > 0) {
                totalInterest += interest;
                summary.totalInterest += interest;
            }

            if (loan.status === 'active') summary.activeLoans++;
            else if (loan.status === 'paid') summary.paidLoans++;
            else if (loan.status === 'defaulted') summary.defaultedLoans++;
            else if (loan.status === 'pending') summary.pendingLoans++;

            if (daysOverdue > 0) summary.overdueLoans++;

            totalInterestRate += interestRate;
            totalTenure += tenure;

            // Department aggregation
            const deptName = emp?.department || 'Unknown';
            if (!departmentMap[deptName]) {
                departmentMap[deptName] = {
                    department: deptName,
                    totalLoans: 0,
                    totalAmount: 0,
                    totalRepaid: 0,
                    totalOutstanding: 0,
                    activeLoans: 0,
                    paidLoans: 0,
                    defaultedLoans: 0
                };
            }
            const dept = departmentMap[deptName];
            dept.totalLoans++;
            dept.totalAmount += loanAmount;
            dept.totalRepaid += totalPaid;
            dept.totalOutstanding += remainingAmount;
            if (loan.status === 'active') dept.activeLoans++;
            else if (loan.status === 'paid') dept.paidLoans++;
            else if (loan.status === 'defaulted') dept.defaultedLoans++;

            // Status aggregation
            if (!statusMap[loan.status]) {
                statusMap[loan.status] = { count: 0, amount: 0 };
            }
            statusMap[loan.status].count++;
            statusMap[loan.status].amount += loanAmount;

            // Monthly trend
            const startMonth = new Date(loan.startDate);
            const trendKey = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyTrendMap[trendKey]) {
                monthlyTrendMap[trendKey] = {
                    year: startMonth.getFullYear(),
                    month: startMonth.getMonth() + 1,
                    monthName: startMonth.toLocaleString('default', { month: 'short' }),
                    disbursed: 0,
                    repaid: 0,
                    newLoans: 0,
                    closedLoans: 0
                };
            }
            monthlyTrendMap[trendKey].disbursed += loanAmount;
            monthlyTrendMap[trendKey].repaid += totalPaid;
            monthlyTrendMap[trendKey].newLoans++;
            if (loan.status === 'paid') monthlyTrendMap[trendKey].closedLoans++;

            // Top borrowers
            if (emp) {
                const empId = emp._id.toString();
                if (!borrowerMap[empId]) {
                    borrowerMap[empId] = {
                        employeeId: emp._id,
                        employeeName: emp.name,
                        employeeCode: `EMP-${String(emp._id).slice(-6).toUpperCase()}`,
                        department: emp.department,
                        totalBorrowed: 0,
                        totalLoans: 0,
                        outstanding: 0
                    };
                }
                borrowerMap[empId].totalBorrowed += loanAmount;
                borrowerMap[empId].totalLoans++;
                borrowerMap[empId].outstanding += remainingAmount;
            }

            return {
                loanId: loan._id,
                employeeId: emp?._id,
                employeeCode: emp ? `EMP-${String(emp._id).slice(-6).toUpperCase()}` : 'N/A',
                employeeName: emp?.name || 'N/A',
                department: emp?.department || 'N/A',
                position: emp?.position || 'N/A',
                amount: loanAmount,
                interestRate,
                tenure,
                monthlyInstallment,
                totalPaid,
                remainingAmount,
                status: loan.status,
                startDate: loan.startDate,
                endDate: loan.endDate,
                purpose: loan.purpose,
                paymentMethod: loan.paymentMethod || 'bank_transfer',
                daysOverdue,
                progressPercentage
            };
        });

        // Calculate averages
        summary.averageLoanAmount = loans.length > 0
            ? Math.round(summary.totalLoanAmount / loans.length)
            : 0;
        summary.averageInterestRate = loans.length > 0
            ? Math.round((totalInterestRate / loans.length) * 100) / 100
            : 0;
        summary.averageTenure = loans.length > 0
            ? Math.round((totalTenure / loans.length) * 10) / 10
            : 0;
        summary.totalDisbursed = summary.totalLoanAmount;
        summary.recoveryRate = summary.totalLoanAmount > 0
            ? Math.round((summary.totalRepaid / summary.totalLoanAmount) * 100 * 100) / 100
            : 0;

        // Build department-wise data
        const departmentWiseData = Object.values(departmentMap).map(dept => ({
            ...dept,
            averageLoanAmount: dept.totalLoans > 0
                ? Math.round(dept.totalAmount / dept.totalLoans)
                : 0
        }));

        // Build status-wise data
        const statusWiseData = Object.entries(statusMap).map(([status, data]) => ({
            status,
            count: data.count,
            amount: data.amount,
            percentage: summary.totalLoans > 0
                ? Math.round((data.count / summary.totalLoans) * 100 * 100) / 100
                : 0
        }));

        // Build monthly trend data
        const monthlyTrendData = Object.values(monthlyTrendMap)
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // Build top borrowers data (sorted by total borrowed)
        const topBorrowersData = Object.values(borrowerMap)
            .sort((a, b) => b.totalBorrowed - a.totalBorrowed)
            .slice(0, 10);

        // Create report
        const report = await LoanReport.create({
            title: title || `Loan Report - ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
            reportType: reportType || 'summary',
            dateRange: { startDate: start, endDate: end },
            department: department || 'all',
            employeeIds: employeeIdList,
            loanIds: loans.map(l => l._id),
            filters: {
                status: filterStatus || 'all',
                minAmount: minAmount || 0,
                maxAmount: maxAmount || null,
                paymentMethod: paymentMethod || 'all'
            },
            summary,
            loanData,
            departmentWiseData,
            statusWiseData,
            monthlyTrendData,
            topBorrowersData,
            generatedBy: req.user.id,
            status: 'completed',
            notes
        });

        res.status(201).json({
            success: true,
            data: report,
            message: 'Loan report generated successfully'
        });
    } catch (error) {
        console.error('Error generating loan report:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete loan report
// @route   DELETE /api/loan-reports/:id
// @access  Private (Admin only)
const deleteLoanReport = async (req, res) => {
    try {
        const report = await LoanReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Loan report not found'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Loan report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get quick loan summary
// @route   GET /api/loan-reports/summary
// @access  Private
const getLoanSummary = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const employeeQuery = {};
        if (department && department !== 'all') employeeQuery.department = department;

        const employees = await Employee.find(employeeQuery);
        const employeeIdList = employees.map(e => e._id);

        const loanQuery = {
            startDate: { $gte: start, $lte: end }
        };
        if (employeeIdList.length > 0) loanQuery.employeeId = { $in: employeeIdList };

        const loans = await Loan.find(loanQuery);

        const summary = {
            totalLoans: loans.length,
            totalAmount: 0,
            totalRepaid: 0,
            totalOutstanding: 0,
            active: 0,
            paid: 0,
            defaulted: 0,
            pending: 0,
            averageLoanAmount: 0,
            recoveryRate: 0,
            dateRange: { startDate: start, endDate: end }
        };

        loans.forEach(loan => {
            summary.totalAmount += loan.amount || 0;
            summary.totalRepaid += loan.totalPaid || 0;
            summary.totalOutstanding += Math.max(0, (loan.amount || 0) - (loan.totalPaid || 0));

            if (loan.status === 'active') summary.active++;
            else if (loan.status === 'paid') summary.paid++;
            else if (loan.status === 'defaulted') summary.defaulted++;
            else if (loan.status === 'pending') summary.pending++;
        });

        summary.averageLoanAmount = loans.length > 0
            ? Math.round(summary.totalAmount / loans.length)
            : 0;
        summary.recoveryRate = summary.totalAmount > 0
            ? Math.round((summary.totalRepaid / summary.totalAmount) * 100 * 100) / 100
            : 0;

        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get loan trend
// @route   GET /api/loan-reports/trend
// @access  Private
const getLoanTrend = async (req, res) => {
    try {
        const { months = 12, department } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const loanQuery = {
            startDate: { $gte: startDate, $lte: endDate }
        };

        if (department && department !== 'all') {
            const employees = await Employee.find({ department });
            loanQuery.employeeId = { $in: employees.map(e => e._id) };
        }

        const loans = await Loan.find(loanQuery);

        const trendMap = {};
        const now = new Date(startDate);

        // Initialize all months
        const current = new Date(startDate);
        while (current <= endDate) {
            const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
            trendMap[key] = {
                year: current.getFullYear(),
                month: current.getMonth() + 1,
                monthName: current.toLocaleString('default', { month: 'short' }),
                disbursed: 0,
                repaid: 0,
                newLoans: 0,
                closedLoans: 0
            };
            current.setMonth(current.getMonth() + 1);
        }

        loans.forEach(loan => {
            const loanDate = new Date(loan.startDate);
            const key = `${loanDate.getFullYear()}-${String(loanDate.getMonth() + 1).padStart(2, '0')}`;

            if (trendMap[key]) {
                trendMap[key].disbursed += loan.amount || 0;
                trendMap[key].repaid += loan.totalPaid || 0;
                trendMap[key].newLoans++;
                if (loan.status === 'paid') trendMap[key].closedLoans++;
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

// @desc    Get loan status distribution
// @route   GET /api/loan-reports/status-distribution
// @access  Private
const getLoanStatusDistribution = async (req, res) => {
    try {
        const distribution = await Loan.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
        ]);

        const total = distribution.reduce((sum, d) => sum + d.count, 0);

        const data = distribution.map(d => ({
            status: d._id,
            count: d.count,
            amount: d.amount,
            percentage: total > 0 ? Math.round((d.count / total) * 100 * 100) / 100 : 0
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get top borrowers
// @route   GET /api/loan-reports/top-borrowers
// @access  Private
const getTopBorrowers = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const borrowers = await Loan.aggregate([
            {
                $group: {
                    _id: '$employeeId',
                    totalBorrowed: { $sum: '$amount' },
                    totalLoans: { $sum: 1 },
                    outstanding: {
                        $sum: { $subtract: ['$amount', { $ifNull: ['$totalPaid', 0] }] }
                    }
                }
            },
            { $sort: { totalBorrowed: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'employees',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'employee'
                }
            },
            { $unwind: '$employee' }
        ]);

        const data = borrowers.map(b => ({
            employeeId: b._id,
            employeeName: b.employee.name,
            employeeCode: `EMP-${String(b._id).slice(-6).toUpperCase()}`,
            department: b.employee.department,
            totalBorrowed: b.totalBorrowed,
            totalLoans: b.totalLoans,
            outstanding: b.outstanding
        }));

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get overdue loans
// @route   GET /api/loan-reports/overdue
// @access  Private
const getOverdueLoans = async (req, res) => {
    try {
        const now = new Date();

        const overdueLoans = await Loan.find({
            status: 'active',
            endDate: { $lt: now }
        }).populate('employeeId', 'name email department position');

        const data = overdueLoans.map(loan => {
            const daysOverdue = Math.ceil((now - new Date(loan.endDate)) / (1000 * 60 * 60 * 24));
            return {
                loanId: loan._id,
                employeeName: loan.employeeId?.name,
                employeeCode: loan.employeeId ? `EMP-${String(loan.employeeId._id).slice(-6).toUpperCase()}` : 'N/A',
                department: loan.employeeId?.department,
                amount: loan.amount,
                remainingAmount: Math.max(0, loan.amount - (loan.totalPaid || 0)),
                endDate: loan.endDate,
                daysOverdue
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getLoanReports,
    getLoanReportById,
    generateLoanReport,
    deleteLoanReport,
    getLoanSummary,
    getLoanTrend,
    getLoanStatusDistribution,
    getTopBorrowers,
    getOverdueLoans
};