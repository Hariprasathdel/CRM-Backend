const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');

// Default leave allocation
const DEFAULT_ALLOCATION = {
    annual: 20,
    sick: 12,
    casual: 8,
    personal: 5,
    emergency: 3,
    maternity: 90,
    paternity: 15,
    unpaid: 30
};

// @desc    Get all leave balances
// @route   GET /api/leave-balances
// @access  Private
const getLeaveBalances = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            year,
            department,
            employeeId,
            search,
            status = 'active'
        } = req.query;

        const query = { status };
        if (year) query.year = parseInt(year);
        if (department && department !== 'all') query.department = department;
        if (employeeId) query.employeeId = employeeId;
        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            query.$or = [
                { employeeName: searchRegex },
                { employeeCode: searchRegex },
                { department: searchRegex },
                { position: searchRegex }
            ];
        }

        const balances = await LeaveBalance.find(query)
            .populate('employeeId', 'name email department position profileImage status initials')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ employeeName: 1 });

        const total = await LeaveBalance.countDocuments(query);

        res.json({
            success: true,
            data: balances,
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

// @desc    Get leave balance for an employee
// @route   GET /api/leave-balances/employee/:employeeId
// @access  Private
const getEmployeeBalance = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

        let balance = await LeaveBalance.findOne({ employeeId, year })
            .populate('employeeId', 'name email department position profileImage joinDate');

        // Auto-create if not exists
        if (!balance) {
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }

            balance = await createBalanceForEmployee(employee, year, req.user.id);
        }

        // Get leaves for this employee this year
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);

        const leaves = await Leave.find({
            employeeId,
            startDate: { $gte: startOfYear, $lte: endOfYear }
        }).sort({ startDate: -1 });

        res.json({
            success: true,
            data: {
                balance,
                leaves
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user's leave balance
// @route   GET /api/leave-balances/my-balance
// @access  Private
const getMyBalance = async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
        const employeeId = req.user.employeeId || req.user.id;

        let balance = await LeaveBalance.findOne({ employeeId, year })
            .populate('employeeId', 'name email department position profileImage');

        if (!balance) {
            const employee = await Employee.findById(employeeId);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee profile not found'
                });
            }
            balance = await createBalanceForEmployee(employee, year, req.user.id);
        }

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create/Update leave balance
// @route   POST /api/leave-balances
// @access  Private (Admin)
const createOrUpdateBalance = async (req, res) => {
    try {
        const {
            employeeId,
            year,
            balances,
            notes
        } = req.body;

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        let balance = await LeaveBalance.findOne({ employeeId, year });

        if (balance) {
            // Update existing
            if (balances) {
                Object.keys(balances).forEach(type => {
                    if (balance.balances[type]) {
                        Object.assign(balance.balances[type], balances[type]);
                    }
                });
            }
            balance.updatedBy = req.user.id;
            await balance.save();
        } else {
            // Create new
            const initialBalances = {};
            Object.keys(DEFAULT_ALLOCATION).forEach(type => {
                initialBalances[type] = {
                    total: balances?.[type]?.total ?? DEFAULT_ALLOCATION[type],
                    used: 0,
                    pending: 0,
                    carriedForward: 0,
                    available: balances?.[type]?.total ?? DEFAULT_ALLOCATION[type]
                };
            });

            balance = await LeaveBalance.create({
                employeeId,
                employeeName: employee.name,
                employeeCode: `EMP-${String(employee._id).slice(-6).toUpperCase()}`,
                department: employee.department,
                position: employee.position || '',
                avatar: employee.initials || employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                year,
                balances: initialBalances,
                createdBy: req.user.id
            });
        }

        const populated = await LeaveBalance.findById(balance._id)
            .populate('employeeId', 'name email department position profileImage');

        res.status(balance.isNew ? 201 : 200).json({
            success: true,
            data: populated,
            message: 'Leave balance saved successfully'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Balance already exists for this employee and year'
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update leave balance
// @route   PUT /api/leave-balances/:id
// @access  Private (Admin)
const updateBalance = async (req, res) => {
    try {
        const balance = await LeaveBalance.findById(req.params.id);
        if (!balance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        const { balances, notes } = req.body;

        if (balances) {
            Object.keys(balances).forEach(type => {
                if (balance.balances[type]) {
                    Object.assign(balance.balances[type], balances[type]);
                }
            });
        }

        balance.updatedBy = req.user.id;
        await balance.save();

        const populated = await LeaveBalance.findById(balance._id)
            .populate('employeeId', 'name email department position profileImage');

        res.json({
            success: true,
            data: populated,
            message: 'Leave balance updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Adjust leave balance (add/subtract days)
// @route   PATCH /api/leave-balances/:id/adjust
// @access  Private (Admin)
const adjustBalance = async (req, res) => {
    try {
        const { leaveType, days, reason } = req.body;

        if (!leaveType || days === undefined || !reason) {
            return res.status(400).json({
                success: false,
                message: 'leaveType, days, and reason are required'
            });
        }

        const balance = await LeaveBalance.findById(req.params.id);
        if (!balance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        if (!balance.balances[leaveType]) {
            return res.status(400).json({
                success: false,
                message: `Invalid leave type: ${leaveType}`
            });
        }

        // Apply adjustment to total
        balance.balances[leaveType].total += parseFloat(days);

        // Record adjustment
        balance.adjustments.push({
            leaveType,
            days: parseFloat(days),
            reason,
            adjustedBy: req.user.id,
            adjustedByName: req.user.name
        });

        balance.updatedBy = req.user.id;
        await balance.save();

        res.json({
            success: true,
            data: balance,
            message: `Adjusted ${days} days for ${leaveType}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete leave balance
// @route   DELETE /api/leave-balances/:id
// @access  Private (Admin)
const deleteBalance = async (req, res) => {
    try {
        const balance = await LeaveBalance.findById(req.params.id);
        if (!balance) {
            return res.status(404).json({
                success: false,
                message: 'Leave balance not found'
            });
        }

        await balance.deleteOne();

        res.json({
            success: true,
            message: 'Leave balance deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Initialize balances for all employees for a year
// @route   POST /api/leave-balances/initialize-year
// @access  Private (Admin)
const initializeYear = async (req, res) => {
    try {
        const { year, department } = req.body;
        const targetYear = year || new Date().getFullYear();

        const employeeQuery = { status: 'active' };
        if (department && department !== 'all') employeeQuery.department = department;

        const employees = await Employee.find(employeeQuery);

        const results = {
            created: 0,
            skipped: 0,
            errors: []
        };

        for (const emp of employees) {
            try {
                const exists = await LeaveBalance.findOne({ employeeId: emp._id, year: targetYear });
                if (exists) {
                    results.skipped++;
                    continue;
                }
                await createBalanceForEmployee(emp, targetYear, req.user.id);
                results.created++;
            } catch (err) {
                results.errors.push({ employeeId: emp._id, error: err.message });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Initialized ${results.created} balances for ${targetYear}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Process year-end carry forward
// @route   POST /api/leave-balances/carry-forward
// @access  Private (Admin)
const processCarryForward = async (req, res) => {
    try {
        const { fromYear, maxCarryForward = {} } = req.body;
        const sourceYear = fromYear || new Date().getFullYear() - 1;
        const targetYear = sourceYear + 1;

        const sourceBalances = await LeaveBalance.find({ year: sourceYear });

        const results = { processed: 0, errors: [] };

        for (const src of sourceBalances) {
            try {
                let target = await LeaveBalance.findOne({
                    employeeId: src.employeeId,
                    year: targetYear
                });

                if (!target) {
                    const emp = await Employee.findById(src.employeeId);
                    if (!emp) continue;
                    target = await createBalanceForEmployee(emp, targetYear, req.user.id);
                }

                Object.keys(src.balances).forEach(type => {
                    const maxCarry = maxCarryForward[type] ?? src.balances[type].available;
                    const carryAmount = Math.min(
                        src.balances[type].available || 0,
                        maxCarry
                    );
                    if (carryAmount > 0) {
                        target.balances[type].carriedForward += carryAmount;
                    }
                });

                src.carryForwardProcessed = true;
                src.carryForwardDate = new Date();

                target.updatedBy = req.user.id;

                await target.save();
                await src.save();

                results.processed++;
            } catch (err) {
                results.errors.push({ id: src._id, error: err.message });
            }
        }

        res.json({
            success: true,
            data: results,
            message: `Carry forward processed for ${results.processed} employees`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get department summary
// @route   GET /api/leave-balances/department-summary
// @access  Private
const getDepartmentSummary = async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

        const summary = await LeaveBalance.aggregate([
            { $match: { year, status: 'active' } },
            {
                $group: {
                    _id: '$department',
                    employeeCount: { $sum: 1 },
                    totalAnnual: { $sum: '$balances.annual.total' },
                    usedAnnual: { $sum: '$balances.annual.used' },
                    availableAnnual: { $sum: '$balances.annual.available' },
                    totalSick: { $sum: '$balances.sick.total' },
                    usedSick: { $sum: '$balances.sick.used' },
                    availableSick: { $sum: '$balances.sick.available' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get leave balance statistics
// @route   GET /api/leave-balances/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

        const total = await LeaveBalance.countDocuments({ year, status: 'active' });

        const aggregate = await LeaveBalance.aggregate([
            { $match: { year, status: 'active' } },
            {
                $group: {
                    _id: null,
                    totalAnnualAvailable: { $sum: '$balances.annual.available' },
                    totalAnnualUsed: { $sum: '$balances.annual.used' },
                    totalSickAvailable: { $sum: '$balances.sick.available' },
                    totalSickUsed: { $sum: '$balances.sick.used' },
                    avgAnnualAvailable: { $avg: '$balances.annual.available' },
                    avgAnnualUsed: { $avg: '$balances.annual.used' }
                }
            }
        ]);

        // Low balance employees (annual < 3 days)
        const lowBalance = await LeaveBalance.find({
            year,
            status: 'active',
            'balances.annual.available': { $lt: 3 }
        })
            .select('employeeName department balances.annual')
            .limit(20);

        // Zero balance employees
        const zeroBalance = await LeaveBalance.countDocuments({
            year,
            status: 'active',
            'balances.annual.available': 0
        });

        res.json({
            success: true,
            data: {
                year,
                totalEmployees: total,
                totals: aggregate[0] || {},
                lowBalanceCount: lowBalance.length,
                zeroBalanceCount: zeroBalance,
                lowBalanceEmployees: lowBalance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ============ HELPER FUNCTIONS ============

const createBalanceForEmployee = async (employee, year, userId) => {
    const initialBalances = {};
    Object.keys(DEFAULT_ALLOCATION).forEach(type => {
        initialBalances[type] = {
            total: DEFAULT_ALLOCATION[type],
            used: 0,
            pending: 0,
            carriedForward: 0,
            available: DEFAULT_ALLOCATION[type]
        };
    });

    return await LeaveBalance.create({
        employeeId: employee._id,
        employeeName: employee.name,
        employeeCode: `EMP-${String(employee._id).slice(-6).toUpperCase()}`,
        department: employee.department,
        position: employee.position || '',
        avatar: employee.initials || employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
        year,
        balances: initialBalances,
        createdBy: userId
    });
};

module.exports = {
    getLeaveBalances,
    getEmployeeBalance,
    getMyBalance,
    createOrUpdateBalance,
    updateBalance,
    adjustBalance,
    deleteBalance,
    initializeYear,
    processCarryForward,
    getDepartmentSummary,
    getStats,
    createBalanceForEmployee
};