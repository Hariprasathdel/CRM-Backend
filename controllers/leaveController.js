const Leave = require('../models/Leave');
const Employee = require('../models/Employee');

// @desc    Get all leave requests
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, employeeId, startDate, endDate } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (employeeId) query.employeeId = employeeId;
        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }

        const leaves = await Leave.find(query)
            .populate('employeeId', 'name email department profileImage')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Leave.countDocuments(query);

        res.json({
            success: true,
            data: leaves,
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

// @desc    Get leave request by ID
// @route   GET /api/leaves/:id
// @access  Private
const getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id)
            .populate('employeeId', 'name email department profileImage');
        
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        res.json({
            success: true,
            data: leave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Private
const createLeave = async (req, res) => {
    try {
        const { employeeId, reason, type, startDate, endDate, status } = req.body;

        // Check if employee exists
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Check for overlapping leave requests
        const overlapping = await Leave.findOne({
            employeeId,
            status: { $in: ['pending', 'approved'] },
            $or: [
                {
                    startDate: { $lte: new Date(endDate) },
                    endDate: { $gte: new Date(startDate) }
                }
            ]
        });

        if (overlapping) {
            return res.status(400).json({
                success: false,
                message: 'Employee already has a leave request for this period'
            });
        }

        const leave = await Leave.create({
            employeeId,
            employeeName: employee.name,
            reason,
            type,
            startDate,
            endDate,
            status: status || 'pending'
        });

        const populatedLeave = await Leave.findById(leave._id)
            .populate('employeeId', 'name email department profileImage');

        res.status(201).json({
            success: true,
            data: populatedLeave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update leave request
// @route   PUT /api/leaves/:id
// @access  Private
const updateLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        const { reason, type, startDate, endDate, status } = req.body;

        leave.reason = reason || leave.reason;
        leave.type = type || leave.type;
        leave.startDate = startDate || leave.startDate;
        leave.endDate = endDate || leave.endDate;
        leave.status = status || leave.status;

        const updatedLeave = await leave.save();
        
        const populatedLeave = await Leave.findById(updatedLeave._id)
            .populate('employeeId', 'name email department profileImage');

        res.json({
            success: true,
            data: populatedLeave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete leave request
// @route   DELETE /api/leaves/:id
// @access  Private
const deleteLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        await leave.deleteOne();

        res.json({
            success: true,
            message: 'Leave request deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Approve leave request
// @route   PUT /api/leaves/:id/approve
// @access  Private
const approveLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        leave.status = 'approved';
        const updatedLeave = await leave.save();

        res.json({
            success: true,
            data: updatedLeave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Reject leave request
// @route   PUT /api/leaves/:id/reject
// @access  Private
const rejectLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        
        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave request not found'
            });
        }

        leave.status = 'rejected';
        const updatedLeave = await leave.save();

        res.json({
            success: true,
            data: updatedLeave
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get leave statistics
// @route   GET /api/leaves/stats
// @access  Private
const getLeaveStats = async (req, res) => {
    try {
        const total = await Leave.countDocuments();
        const pending = await Leave.countDocuments({ status: 'pending' });
        const approved = await Leave.countDocuments({ status: 'approved' });
        const rejected = await Leave.countDocuments({ status: 'rejected' });

        const typeStats = await Leave.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                pending,
                approved,
                rejected,
                types: typeStats
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
    getLeaves,
    getLeaveById,
    createLeave,
    updateLeave,
    deleteLeave,
    approveLeave,
    rejectLeave,
    getLeaveStats
};