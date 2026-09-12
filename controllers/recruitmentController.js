const Recruitment = require('../models/Recruitment');

// @desc    Get all recruitments
// @route   GET /api/recruitments
// @access  Private
const getRecruitments = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, department, search } = req.query;
        
        const query = {};
        if (status) query.status = status;
        if (department) query.department = department;
        if (search) {
            query.$or = [
                { jobTitle: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const recruitments = await Recruitment.find(query)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ postedDate: -1 });

        const total = await Recruitment.countDocuments(query);

        res.json({
            success: true,
            data: recruitments,
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

// @desc    Get recruitment by ID
// @route   GET /api/recruitments/:id
// @access  Private
const getRecruitmentById = async (req, res) => {
    try {
        const recruitment = await Recruitment.findById(req.params.id);
        
        if (!recruitment) {
            return res.status(404).json({
                success: false,
                message: 'Recruitment posting not found'
            });
        }

        res.json({
            success: true,
            data: recruitment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Create recruitment
// @route   POST /api/recruitments
// @access  Private
const createRecruitment = async (req, res) => {
    try {
        const { jobTitle, department, vacancies, description, requirements, status, postedDate, applications } = req.body;

        const recruitment = await Recruitment.create({
            jobTitle,
            department,
            vacancies,
            description,
            requirements: requirements || [],
            status: status || 'open',
            postedDate: postedDate || Date.now(),
            applications: applications || 0
        });

        res.status(201).json({
            success: true,
            data: recruitment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Update recruitment
// @route   PUT /api/recruitments/:id
// @access  Private
const updateRecruitment = async (req, res) => {
    try {
        const recruitment = await Recruitment.findById(req.params.id);
        
        if (!recruitment) {
            return res.status(404).json({
                success: false,
                message: 'Recruitment posting not found'
            });
        }

        const { jobTitle, department, vacancies, description, requirements, status, postedDate, applications } = req.body;

        recruitment.jobTitle = jobTitle || recruitment.jobTitle;
        recruitment.department = department || recruitment.department;
        recruitment.vacancies = vacancies || recruitment.vacancies;
        recruitment.description = description || recruitment.description;
        recruitment.requirements = requirements || recruitment.requirements;
        recruitment.status = status || recruitment.status;
        recruitment.postedDate = postedDate || recruitment.postedDate;
        recruitment.applications = applications !== undefined ? applications : recruitment.applications;

        const updatedRecruitment = await recruitment.save();

        res.json({
            success: true,
            data: updatedRecruitment
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Delete recruitment
// @route   DELETE /api/recruitments/:id
// @access  Private
const deleteRecruitment = async (req, res) => {
    try {
        const recruitment = await Recruitment.findById(req.params.id);
        
        if (!recruitment) {
            return res.status(404).json({
                success: false,
                message: 'Recruitment posting not found'
            });
        }

        await recruitment.deleteOne();

        res.json({
            success: true,
            message: 'Recruitment posting deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

// @desc    Get recruitment statistics
// @route   GET /api/recruitments/stats
// @access  Private
const getRecruitmentStats = async (req, res) => {
    try {
        const total = await Recruitment.countDocuments();
        const open = await Recruitment.countDocuments({ status: 'open' });
        const closed = await Recruitment.countDocuments({ status: 'closed' });
        const onHold = await Recruitment.countDocuments({ status: 'on_hold' });

        const totalApplications = await Recruitment.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$applications' }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                total,
                open,
                closed,
                onHold,
                totalApplications: totalApplications[0]?.total || 0
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
    getRecruitments,
    getRecruitmentById,
    createRecruitment,
    updateRecruitment,
    deleteRecruitment,
    getRecruitmentStats
};