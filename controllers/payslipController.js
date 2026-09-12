const Payslip = require('../models/Payslip');
const Employee = require('../models/Employee');
const Loan = require('../models/Loan');

// @desc    Get all payslips
// @route   GET /api/payslips
// @access  Private
const getPayslips = async (req, res) => {
    try {
        const { page = 1, limit = 10, employeeId, status, month, year } = req.query;
        
        const query = {};
        if (employeeId) query.employeeId = employeeId;
        if (status) query.status = status;
        if (month && year) {
            query['payPeriod.month'] = parseInt(month);
            query['payPeriod.year'] = parseInt(year);
        }

        const payslips = await Payslip.find(query)
            .populate('employeeId', 'name email department profileImage')
            .populate('generatedBy', 'name')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

        const total = await Payslip.countDocuments(query);

        res.json({
            success: true,
            data: payslips,
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

// @desc    Get payslip by ID
// @route   GET /api/payslips/:id
// @access  Private
const getPayslipById = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id)
            .populate('employeeId', 'name email department position profileImage')
            .populate('generatedBy', 'name');

        if (!payslip) {
            return res.status(404).json({
                success: false,
                message: 'Payslip not found'
            });
        }

        res.json({
            success: true,
            data: payslip
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create payslip
// @route   POST /api/payslips
// @access  Private (Admin only)
const createPayslip = async (req, res) => {
    try {
        const { 
            employeeId, 
            payPeriod, 
            earnings, 
            deductions,
            paymentMethod,
            bankDetails,
            notes 
        } = req.body;

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check if payslip already exists for this period
        const existingPayslip = await Payslip.findOne({
            employeeId,
            'payPeriod.month': payPeriod.month,
            'payPeriod.year': payPeriod.year
        });

        if (existingPayslip) {
            return res.status(400).json({
                success: false,
                message: 'Payslip already exists for this employee and period'
            });
        }

        // Calculate totals
        const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + (val || 0), 0);
        const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
        const netPay = totalEarnings - totalDeductions;

        const payslip = await Payslip.create({
            employeeId,
            employeeName: employee.name,
            employeeCode: `EMP-${String(employee._id).slice(-6)}`,
            department: employee.department,
            position: employee.position,
            payPeriod,
            earnings,
            deductions,
            totalEarnings,
            totalDeductions,
            netPay,
            paymentMethod,
            bankDetails,
            generatedBy: req.user.id,
            notes,
            status: 'generated',
            generatedAt: new Date()
        });

        const populatedPayslip = await Payslip.findById(payslip._id)
            .populate('employeeId', 'name email department profileImage')
            .populate('generatedBy', 'name');

        res.status(201).json({
            success: true,
            data: populatedPayslip
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update payslip
// @route   PUT /api/payslips/:id
// @access  Private (Admin only)
const updatePayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        
        if (!payslip) {
            return res.status(404).json({
                success: false,
                message: 'Payslip not found'
            });
        }

        // Don't allow update if status is 'sent' or 'paid'
        if (payslip.status === 'sent' || payslip.status === 'paid') {
            return res.status(400).json({
                success: false,
                message: `Cannot update payslip that is already ${payslip.status}`
            });
        }

        const { earnings, deductions, paymentMethod, bankDetails, notes, status } = req.body;

        // Update earnings
        if (earnings) {
            Object.keys(earnings).forEach(key => {
                if (payslip.earnings[key] !== undefined) {
                    payslip.earnings[key] = earnings[key] || 0;
                }
            });
        }

        // Update deductions
        if (deductions) {
            Object.keys(deductions).forEach(key => {
                if (payslip.deductions[key] !== undefined) {
                    payslip.deductions[key] = deductions[key] || 0;
                }
            });
        }

        // Recalculate totals
        payslip.totalEarnings = Object.values(payslip.earnings).reduce((sum, val) => sum + (val || 0), 0);
        payslip.totalDeductions = Object.values(payslip.deductions).reduce((sum, val) => sum + (val || 0), 0);
        payslip.netPay = payslip.totalEarnings - payslip.totalDeductions;

        if (paymentMethod) payslip.paymentMethod = paymentMethod;
        if (bankDetails) payslip.bankDetails = bankDetails;
        if (notes) payslip.notes = notes;
        if (status && ['draft', 'generated'].includes(status)) payslip.status = status;

        const updatedPayslip = await payslip.save();
        
        const populatedPayslip = await Payslip.findById(updatedPayslip._id)
            .populate('employeeId', 'name email department profileImage')
            .populate('generatedBy', 'name');

        res.json({
            success: true,
            data: populatedPayslip
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete payslip
// @route   DELETE /api/payslips/:id
// @access  Private (Admin only)
const deletePayslip = async (req, res) => {
    try {
        const payslip = await Payslip.findById(req.params.id);
        
        if (!payslip) {
            return res.status(404).json({
                success: false,
                message: 'Payslip not found'
            });
        }

        await payslip.deleteOne();

        res.json({
            success: true,
            message: 'Payslip deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Generate payslip for employee
// @route   POST /api/payslips/generate
// @access  Private (Admin only)
const generatePayslip = async (req, res) => {
    try {
        const { employeeId, month, year } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get employee's loan details if any
        const loans = await Loan.find({ 
            employeeId, 
            status: 'active' 
        });
        const monthlyLoanPayment = loans.reduce((sum, loan) => sum + loan.monthlyInstallment, 0);

        // Calculate earnings based on employee data
        const basicSalary = employee.salary || 0;
        const houseAllowance = basicSalary * 0.2;
        const transportAllowance = basicSalary * 0.1;
        const medicalAllowance = basicSalary * 0.05;

        const earnings = {
            basicSalary,
            houseAllowance,
            transportAllowance,
            medicalAllowance,
            bonus: 0,
            overtime: 0,
            otherEarnings: 0
        };

        // Calculate deductions
        const tax = basicSalary * 0.1; // Simple tax calculation
        const pension = basicSalary * 0.05;
        const loanRepayment = monthlyLoanPayment;

        const deductions = {
            tax,
            pension,
            loanRepayment,
            insurance: basicSalary * 0.02,
            otherDeductions: 0
        };

        const totalEarnings = Object.values(earnings).reduce((sum, val) => sum + (val || 0), 0);
        const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0);
        const netPay = totalEarnings - totalDeductions;

        const payslipData = {
            employeeId,
            employeeName: employee.name,
            employeeCode: `EMP-${String(employee._id).slice(-6)}`,
            department: employee.department,
            position: employee.position,
            payPeriod: { month, year },
            earnings,
            deductions,
            totalEarnings,
            totalDeductions,
            netPay,
            paymentMethod: 'bank_transfer',
            bankDetails: employee.bankAccount || {},
            generatedBy: req.user.id,
            status: 'generated'
        };

        const payslip = await Payslip.create(payslipData);

        const populatedPayslip = await Payslip.findById(payslip._id)
            .populate('employeeId', 'name email department profileImage')
            .populate('generatedBy', 'name');

        res.status(201).json({
            success: true,
            data: populatedPayslip
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get payslip statistics
// @route   GET /api/payslips/stats
// @access  Private
const getPayslipStats = async (req, res) => {
    try {
        const total = await Payslip.countDocuments();
        const draft = await Payslip.countDocuments({ status: 'draft' });
        const generated = await Payslip.countDocuments({ status: 'generated' });
        const sent = await Payslip.countDocuments({ status: 'sent' });
        const paid = await Payslip.countDocuments({ status: 'paid' });

        const totalAmount = await Payslip.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$netPay' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                draft,
                generated,
                sent,
                paid,
                totalAmount: totalAmount[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

module.exports = {
    getPayslips,
    getPayslipById,
    createPayslip,
    updatePayslip,
    deletePayslip,
    generatePayslip,
    getPayslipStats
};