const Loan = require('../models/Loan');
const Employee = require('../models/Employee');

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
const getLoans = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, employeeId } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (employeeId) query.employeeId = employeeId;

        const loans = await Loan.find(query)
            .populate('employeeId', 'name email department profileImage')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ startDate: -1 });

        const total = await Loan.countDocuments(query);

        res.json({
            success: true,
            data: loans,
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

// @desc    Get loan by ID
// @route   GET /api/loans/:id
// @access  Private
const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id)
            .populate('employeeId', 'name email department profileImage');
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        res.json({
            success: true,
            data: loan
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create loan
// @route   POST /api/loans
// @access  Private
const createLoan = async (req, res) => {
    try {
        const { employeeId, amount, interestRate, tenure, startDate, status, monthlyInstallment } = req.body;

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Calculate monthly installment if not provided
        let monthly = monthlyInstallment;
        if (!monthly) {
            const monthlyRate = interestRate / 100 / 12;
            const totalPayments = tenure;
            monthly = amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments) / 
                     (Math.pow(1 + monthlyRate, totalPayments) - 1);
            monthly = Math.round(monthly);
        }

        const loan = await Loan.create({
            employeeId,
            amount,
            interestRate,
            tenure,
            startDate: startDate || Date.now(),
            status: status || 'active',
            monthlyInstallment: monthly
        });

        const populatedLoan = await Loan.findById(loan._id)
            .populate('employeeId', 'name email department profileImage');

        res.status(201).json({
            success: true,
            data: populatedLoan
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private
const updateLoan = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        const { amount, interestRate, tenure, startDate, status, monthlyInstallment } = req.body;

        loan.amount = amount || loan.amount;
        loan.interestRate = interestRate || loan.interestRate;
        loan.tenure = tenure || loan.tenure;
        loan.startDate = startDate || loan.startDate;
        loan.status = status || loan.status;
        loan.monthlyInstallment = monthlyInstallment || loan.monthlyInstallment;

        const updatedLoan = await loan.save();
        
        const populatedLoan = await Loan.findById(updatedLoan._id)
            .populate('employeeId', 'name email department profileImage');

        res.json({
            success: true,
            data: populatedLoan
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Private
const deleteLoan = async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({
                success: false,
                message: 'Loan not found'
            });
        }

        await loan.deleteOne();

        res.json({
            success: true,
            message: 'Loan deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get loan statistics
// @route   GET /api/loans/stats
// @access  Private
const getLoanStats = async (req, res) => {
    try {
        const total = await Loan.countDocuments();
        const active = await Loan.countDocuments({ status: 'active' });
        const paid = await Loan.countDocuments({ status: 'paid' });
        const defaulted = await Loan.countDocuments({ status: 'defaulted' });

        const totalAmount = await Loan.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                paid,
                defaulted,
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
    getLoans,
    getLoanById,
    createLoan,
    updateLoan,
    deleteLoan,
    getLoanStats
};