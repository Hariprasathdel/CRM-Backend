const Award = require('../models/Award');
const Employee = require('../models/Employee');

// @desc    Get all awards
// @route   GET /api/awards
// @access  Private
const getAwards = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type } = req.query;
        
        const query = {};
        if (search) {
            query.$or = [
                { employeeName: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
                { awardName: { $regex: search, $options: 'i' } }
            ];
        }
        if (type) query.type = type;

        const awards = await Award.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ date: -1 });

        const total = await Award.countDocuments(query);

        res.json({
            success: true,
            data: awards,
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

// @desc    Get award by ID
// @route   GET /api/awards/:id
// @access  Private
const getAwardById = async (req, res) => {
    try {
        const award = await Award.findById(req.params.id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }

        res.json({
            success: true,
            data: award
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create award
// @route   POST /api/awards
// @access  Private
const createAward = async (req, res) => {
    try {
        const { employeeId, employeeName, department, awardName, type, date, description } = req.body;

        const award = await Award.create({
            employeeId,
            employeeName,
            department,
            awardName,
            type,
            date: date || Date.now(),
            description
        });

        res.status(201).json({
            success: true,
            data: award
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update award
// @route   PUT /api/awards/:id
// @access  Private
const updateAward = async (req, res) => {
    try {
        const award = await Award.findById(req.params.id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }

        const { employeeName, department, awardName, type, date, description } = req.body;

        award.employeeName = employeeName || award.employeeName;
        award.department = department || award.department;
        award.awardName = awardName || award.awardName;
        award.type = type || award.type;
        award.date = date || award.date;
        award.description = description || award.description;

        const updatedAward = await award.save();

        res.json({
            success: true,
            data: updatedAward
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete award
// @route   DELETE /api/awards/:id
// @access  Private
const deleteAward = async (req, res) => {
    try {
        const award = await Award.findById(req.params.id);
        
        if (!award) {
            return res.status(404).json({
                success: false,
                message: 'Award not found'
            });
        }

        await award.deleteOne();

        res.json({
            success: true,
            message: 'Award deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get award statistics
// @route   GET /api/awards/stats
// @access  Private
const getAwardStats = async (req, res) => {
    try {
        const total = await Award.countDocuments();
        
        const typeStats = await Award.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]);

        const departmentStats = await Award.aggregate([
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
                types: typeStats,
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
    getAwards,
    getAwardById,
    createAward,
    updateAward,
    deleteAward,
    getAwardStats
};