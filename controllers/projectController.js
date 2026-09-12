const Project = require('../models/Project');
const Employee = require('../models/Employee');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, department, search } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (department) query.department = department;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const projects = await Project.find(query)
            .populate('assignedEmployees', 'name email department profileImage')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ startDate: -1 });

        const total = await Project.countDocuments(query);

        res.json({
            success: true,
            data: projects,
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

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('assignedEmployees', 'name email department profileImage');
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    try {
        const { name, description, department, startDate, endDate, status, progress, assignedEmployees } = req.body;

        const project = await Project.create({
            name,
            description,
            department,
            startDate,
            endDate,
            status: status || 'planning',
            progress: progress || 0,
            assignedEmployees: assignedEmployees || []
        });

        const populatedProject = await Project.findById(project._id)
            .populate('assignedEmployees', 'name email department profileImage');

        res.status(201).json({
            success: true,
            data: populatedProject
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        const { name, description, department, startDate, endDate, status, progress, assignedEmployees } = req.body;

        project.name = name || project.name;
        project.description = description || project.description;
        project.department = department || project.department;
        project.startDate = startDate || project.startDate;
        project.endDate = endDate || project.endDate;
        project.status = status || project.status;
        project.progress = progress !== undefined ? progress : project.progress;
        project.assignedEmployees = assignedEmployees || project.assignedEmployees;

        const updatedProject = await project.save();
        
        const populatedProject = await Project.findById(updatedProject._id)
            .populate('assignedEmployees', 'name email department profileImage');

        res.json({
            success: true,
            data: populatedProject
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        await project.deleteOne();

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get project statistics
// @route   GET /api/projects/stats
// @access  Private
const getProjectStats = async (req, res) => {
    try {
        const total = await Project.countDocuments();
        const planning = await Project.countDocuments({ status: 'planning' });
        const ongoing = await Project.countDocuments({ status: 'ongoing' });
        const completed = await Project.countDocuments({ status: 'completed' });
        const onHold = await Project.countDocuments({ status: 'on_hold' });

        const avgProgress = await Project.aggregate([
            {
                $group: {
                    _id: null,
                    avg: { $avg: '$progress' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                planning,
                ongoing,
                completed,
                onHold,
                averageProgress: Math.round(avgProgress[0]?.avg || 0)
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
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectStats
};