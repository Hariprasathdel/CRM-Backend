const Department = require('../models/Department');
const Employee = require('../models/Employee');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { head: { $regex: search, $options: 'i' } }
            ];
        }

        const departments = await Department.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        // Update employee counts for each department
        for (let dept of departments) {
            const count = await Employee.countDocuments({ department: dept.name, status: 'active' });
            dept.employeeCount = count;
            await dept.save();
        }

        const total = await Department.countDocuments(query);

        res.json({
            success: true,
            data: departments,
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

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Update employee count
        const count = await Employee.countDocuments({ department: department.name, status: 'active' });
        department.employeeCount = count;
        await department.save();

        res.json({
            success: true,
            data: department
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Private
const createDepartment = async (req, res) => {
    try {
        const { name, description, head, employeeCount } = req.body;

        // Check if department exists
        const deptExists = await Department.findOne({ name });
        if (deptExists) {
            return res.status(400).json({
                success: false,
                message: 'Department already exists'
            });
        }

        const department = await Department.create({
            name,
            description,
            head,
            employeeCount: employeeCount || 0
        });

        res.status(201).json({
            success: true,
            data: department
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private
const updateDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        const { name, description, head, employeeCount } = req.body;

        // Check if name is taken
        if (name && name !== department.name) {
            const nameExists = await Department.findOne({ name, _id: { $ne: req.params.id } });
            if (nameExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Department name already taken'
                });
            }
        }

        department.name = name || department.name;
        department.description = description || department.description;
        department.head = head || department.head;
        department.employeeCount = employeeCount !== undefined ? employeeCount : department.employeeCount;

        const updatedDepartment = await department.save();

        res.json({
            success: true,
            data: updatedDepartment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private
const deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }

        // Check if employees exist in this department
        const employees = await Employee.countDocuments({ department: department.name });
        if (employees > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete department with ${employees} employees. Please reassign them first.`
            });
        }

        await department.deleteOne();

        res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get department statistics
// @route   GET /api/departments/stats
// @access  Private
const getDepartmentStats = async (req, res) => {
    try {
        const total = await Department.countDocuments();
        
        const employeeCounts = await Employee.aggregate([
            {
                $match: { status: 'active' }
            },
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
                employees: employeeCounts
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
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentStats
};