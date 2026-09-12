const Employee = require('../models/Employee');
const User = require('../models/User');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
const getEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, department } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { position: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) query.status = status;
        if (department) query.department = department;

        const employees = await Employee.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Employee.countDocuments(query);

        res.json({
            success: true,
            data: employees,
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

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create employee
// @route   POST /api/employees
// @access  Private
const createEmployee = async (req, res) => {
    try {
        const { name, email, phone, department, position, status, joinDate, address, profileImage } = req.body;

        // Check if employee exists
        const employeeExists = await Employee.findOne({ email });
        if (employeeExists) {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }

        const employee = await Employee.create({
            name,
            email,
            phone,
            department,
            position,
            status: status || 'active',
            joinDate: joinDate || Date.now(),
            address,
            profileImage
        });

        res.status(201).json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        const { name, email, phone, department, position, status, joinDate, address, profileImage } = req.body;

        // Check if email is taken by another employee
        if (email && email !== employee.email) {
            const emailExists = await Employee.findOne({ email, _id: { $ne: req.params.id } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }

        employee.name = name || employee.name;
        employee.email = email || employee.email;
        employee.phone = phone || employee.phone;
        employee.department = department || employee.department;
        employee.position = position || employee.position;
        employee.status = status || employee.status;
        employee.joinDate = joinDate || employee.joinDate;
        employee.address = address || employee.address;
        employee.profileImage = profileImage || employee.profileImage;

        const updatedEmployee = await employee.save();

        res.json({
            success: true,
            data: updatedEmployee
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        await employee.deleteOne();

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get employee statistics
// @route   GET /api/employees/stats
// @access  Private
const getEmployeeStats = async (req, res) => {
    try {
        const total = await Employee.countDocuments();
        const active = await Employee.countDocuments({ status: 'active' });
        const inactive = await Employee.countDocuments({ status: 'inactive' });
        const onLeave = await Employee.countDocuments({ status: 'on_leave' });

        const departmentStats = await Employee.aggregate([
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive,
                onLeave,
                departments: departmentStats
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
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeStats
};