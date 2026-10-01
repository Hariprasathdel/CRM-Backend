const JobPosting = require('../models/JobPosting');
const Applicant = require('../models/Applicant');
const Employee = require('../models/Employee');

// @desc    Get all job postings
// @route   GET /api/job-postings
// @access  Private
const getJobPostings = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            department,
            employmentType,
            workType,
            priority,
            search,
            sortBy = 'postedDate',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (department) query.department = department;
        if (employmentType) query.employmentType = employmentType;
        if (workType) query.workType = workType;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { jobTitle: { $regex: search, $options: 'i' } },
                { jobCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const jobPostings = await JobPosting.find(query)
            .populate('hiringManager', 'name email department position')
            .populate('recruiter', 'name email')
            .populate('createdBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await JobPosting.countDocuments(query);

        res.json({
            success: true,
            data: jobPostings,
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

// @desc    Get single job posting
// @route   GET /api/job-postings/:id
// @access  Private
const getJobPostingById = async (req, res) => {
    try {
        const jobPosting = await JobPosting.findById(req.params.id)
            .populate('hiringManager', 'name email department position')
            .populate('recruiter', 'name email')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        if (!jobPosting) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        // Get applicant count by status
        const applicantStats = await Applicant.aggregate([
            { $match: { jobId: jobPosting._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                ...jobPosting.toObject(),
                applicantStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create job posting
// @route   POST /api/job-postings
// @access  Private (Admin)
const createJobPosting = async (req, res) => {
    try {
        const {
            jobTitle,
            department,
            vacancies,
            description,
            responsibilities,
            requirements,
            qualifications,
            skills,
            experienceRequired,
            educationRequired,
            salaryRange,
            employmentType,
            workType,
            workLocation,
            city,
            state,
            country,
            benefits,
            status,
            priority,
            closingDate,
            hiringManager,
            recruiter,
            contactPerson,
            tags,
            notes
        } = req.body;

        // Get hiring manager name if provided
        let hiringManagerName = null;
        if (hiringManager) {
            const emp = await Employee.findById(hiringManager);
            if (emp) hiringManagerName = emp.name;
        }

        const jobPosting = await JobPosting.create({
            jobTitle,
            department,
            vacancies,
            description,
            responsibilities: responsibilities || [],
            requirements: requirements || [],
            qualifications: qualifications || [],
            skills: skills || [],
            experienceRequired,
            educationRequired,
            salaryRange,
            employmentType: employmentType || 'full_time',
            workType: workType || 'onsite',
            workLocation,
            city,
            state,
            country,
            benefits: benefits || [],
            status: status || 'draft',
            priority: priority || 'medium',
            closingDate,
            hiringManager,
            hiringManagerName,
            recruiter,
            recruiterName: req.user.name,
            contactPerson,
            tags: tags || [],
            notes,
            createdBy: req.user.id
        });

        const populated = await JobPosting.findById(jobPosting._id)
            .populate('hiringManager', 'name email department position')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populated,
            message: 'Job posting created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update job posting
// @route   PUT /api/job-postings/:id
// @access  Private (Admin)
const updateJobPosting = async (req, res) => {
    try {
        const jobPosting = await JobPosting.findById(req.params.id);

        if (!jobPosting) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        // If hiring manager changes, update name
        if (req.body.hiringManager && req.body.hiringManager !== jobPosting.hiringManager?.toString()) {
            const emp = await Employee.findById(req.body.hiringManager);
            if (emp) req.body.hiringManagerName = emp.name;
        }

        // Auto-set filled date if status changes to filled
        if (req.body.status === 'filled' && jobPosting.status !== 'filled') {
            req.body.filledDate = new Date();
        }

        const updates = { ...req.body, updatedBy: req.user.id };

        const updated = await JobPosting.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('hiringManager', 'name email department position')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

        res.json({
            success: true,
            data: updated,
            message: 'Job posting updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update job posting status
// @route   PATCH /api/job-postings/:id/status
// @access  Private
const updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const jobPosting = await JobPosting.findById(req.params.id);
        if (!jobPosting) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        jobPosting.status = status;
        jobPosting.updatedBy = req.user.id;

        if (status === 'filled') {
            jobPosting.filledDate = new Date();
        }

        await jobPosting.save();

        res.json({
            success: true,
            data: jobPosting,
            message: `Job posting ${status}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete job posting
// @route   DELETE /api/job-postings/:id
// @access  Private (Admin)
const deleteJobPosting = async (req, res) => {
    try {
        const jobPosting = await JobPosting.findById(req.params.id);
        if (!jobPosting) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        // Check if job has applicants
        const applicantCount = await Applicant.countDocuments({ jobId: req.params.id });
        if (applicantCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete job posting with ${applicantCount} applicants. Close it instead.`
            });
        }

        await jobPosting.deleteOne();

        res.json({
            success: true,
            message: 'Job posting deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get job posting statistics
// @route   GET /api/job-postings/stats
// @access  Private
const getJobStats = async (req, res) => {
    try {
        const total = await JobPosting.countDocuments();
        const open = await JobPosting.countDocuments({ status: 'open' });
        const closed = await JobPosting.countDocuments({ status: 'closed' });
        const draft = await JobPosting.countDocuments({ status: 'draft' });
        const onHold = await JobPosting.countDocuments({ status: 'on_hold' });
        const filled = await JobPosting.countDocuments({ status: 'filled' });

        // Total vacancies
        const vacancyStats = await JobPosting.aggregate([
            { $match: { status: 'open' } },
            { $group: { _id: null, total: { $sum: '$vacancies' } } }
        ]);

        // Total applications
        const totalApplications = await Applicant.countDocuments();

        // Applications by status
        const applicationsByStatus = await Applicant.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Department distribution
        const departmentStats = await JobPosting.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                total,
                open,
                closed,
                draft,
                onHold,
                filled,
                totalVacancies: vacancyStats[0]?.total || 0,
                totalApplications,
                applicationsByStatus,
                departmentStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Publish job to channels
// @route   POST /api/job-postings/:id/publish
// @access  Private
const publishJob = async (req, res) => {
    try {
        const { channels } = req.body;

        const jobPosting = await JobPosting.findById(req.params.id);
        if (!jobPosting) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        if (channels && Array.isArray(channels)) {
            channels.forEach(channel => {
                jobPosting.publishedOn.push({
                    channel: channel.channel,
                    url: channel.url,
                    publishedAt: new Date()
                });
            });
        }

        jobPosting.status = 'open';
        jobPosting.postedDate = new Date();
        await jobPosting.save();

        res.json({
            success: true,
            data: jobPosting,
            message: 'Job published successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getJobPostings,
    getJobPostingById,
    createJobPosting,
    updateJobPosting,
    updateJobStatus,
    deleteJobPosting,
    getJobStats,
    publishJob
};