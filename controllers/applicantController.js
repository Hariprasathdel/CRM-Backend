const Applicant = require('../models/Applicant');
const JobPosting = require('../models/JobPosting');

// Helper: update job stats after applicant change
const updateJobStats = async (jobId) => {
    try {
        const stats = await Applicant.aggregate([
            { $match: { jobId: jobId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statsMap = {};
        stats.forEach(s => { statsMap[s._id] = s.count; });

        const totalApplications = await Applicant.countDocuments({ jobId });

        await JobPosting.findByIdAndUpdate(jobId, {
            totalApplications,
            shortlisted: statsMap['shortlisted'] || 0,
            interviewed: (statsMap['interviewed'] || 0) + (statsMap['technical_round'] || 0) + (statsMap['hr_round'] || 0),
            offered: statsMap['offered'] || 0,
            hired: statsMap['hired'] || 0,
            rejected: statsMap['rejected'] || 0
        });
    } catch (error) {
        console.error('Error updating job stats:', error);
    }
};

// @desc    Get all applicants
// @route   GET /api/applicants
// @access  Private
const getApplicants = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            stage,
            jobId,
            department,
            assignedTo,
            search,
            sortBy = 'appliedDate',
            sortOrder = 'desc',
            minRating,
            source
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (stage) query.stage = stage;
        if (jobId) query.jobId = jobId;
        if (department) query.department = department;
        if (assignedTo) query.assignedTo = assignedTo;
        if (source) query.applicationSource = source;
        if (minRating) query.rating = { $gte: parseFloat(minRating) };

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { applicantCode: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const applicants = await Applicant.find(query)
            .populate('jobId', 'jobTitle jobCode department')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await Applicant.countDocuments(query);

        res.json({
            success: true,
            data: applicants,
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

// @desc    Get applicants for a specific job
// @route   GET /api/applicants/job/:jobId
// @access  Private
const getApplicantsByJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { page = 1, limit = 50, status } = req.query;

        const query = { jobId };
        if (status) query.status = status;

        const applicants = await Applicant.find(query)
            .populate('jobId', 'jobTitle jobCode department')
            .populate('assignedTo', 'name email')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ appliedDate: -1 });

        const total = await Applicant.countDocuments(query);

        // Get status counts for this job
        const statusCounts = await Applicant.aggregate([
            { $match: { jobId: require('mongoose').Types.ObjectId(jobId) } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: applicants,
            statusCounts,
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

// @desc    Get single applicant
// @route   GET /api/applicants/:id
// @access  Private
const getApplicantById = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id)
            .populate('jobId', 'jobTitle jobCode department description requirements')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('rejection.rejectedBy', 'name email')
            .populate('communications.sentBy', 'name email');

        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        res.json({ success: true, data: applicant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create applicant
// @route   POST /api/applicants
// @access  Private
const createApplicant = async (req, res) => {
    try {
        const {
            jobId,
            firstName,
            lastName,
            email,
            phone,
            alternatePhone,
            dateOfBirth,
            gender,
            nationality,
            maritalStatus,
            address,
            currentCompany,
            currentPosition,
            totalExperience,
            relevantExperience,
            currentSalary,
            expectedSalary,
            noticePeriod,
            willingToRelocate,
            education,
            workExperience,
            skills,
            certifications,
            languages,
            resume,
            coverLetter,
            portfolio,
            linkedIn,
            github,
            website,
            documents,
            applicationSource,
            referredBy,
            assignedTo,
            tags,
            notes
        } = req.body;

        // Verify job exists
        const job = await JobPosting.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job posting not found'
            });
        }

        const applicant = await Applicant.create({
            jobId,
            jobTitle: job.jobTitle,
            jobCode: job.jobCode,
            department: job.department,
            firstName,
            lastName,
            email,
            phone,
            alternatePhone,
            dateOfBirth,
            gender,
            nationality,
            maritalStatus,
            address,
            currentCompany,
            currentPosition,
            totalExperience,
            relevantExperience,
            currentSalary,
            expectedSalary,
            noticePeriod,
            willingToRelocate,
            education: education || [],
            workExperience: workExperience || [],
            skills: skills || [],
            certifications: certifications || [],
            languages: languages || [],
            resume,
            coverLetter,
            portfolio,
            linkedIn,
            github,
            website,
            documents: documents || [],
            applicationSource: applicationSource || 'website',
            referredBy,
            assignedTo,
            tags: tags || [],
            notes,
            createdBy: req.user.id
        });

        // Update job statistics
        await updateJobStats(jobId);

        const populated = await Applicant.findById(applicant._id)
            .populate('jobId', 'jobTitle jobCode department')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populated,
            message: 'Applicant created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update applicant
// @route   PUT /api/applicants/:id
// @access  Private
const updateApplicant = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        const updates = { ...req.body, updatedBy: req.user.id };

        const updated = await Applicant.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('jobId', 'jobTitle jobCode department')
        .populate('assignedTo', 'name email');

        res.json({
            success: true,
            data: updated,
            message: 'Applicant updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update applicant status (pipeline)
// @route   PATCH /api/applicants/:id/status
// @access  Private
const updateApplicantStatus = async (req, res) => {
    try {
        const { status, notes, rating } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        const previousStatus = applicant.status;
        applicant.status = status;
        if (notes) applicant.notes = notes;
        if (rating !== undefined) applicant.rating = rating;
        applicant.updatedBy = req.user.id;

        // Handle rejection
        if (status === 'rejected' && previousStatus !== 'rejected') {
            applicant.rejection = {
                rejected: true,
                rejectedDate: new Date(),
                rejectedBy: req.user.id,
                reason: req.body.rejectionReason || 'other',
                notes: req.body.rejectionNotes
            };
        }

        // Handle hire
        if (status === 'hired' && previousStatus !== 'hired') {
            applicant.offer = {
                ...applicant.offer,
                offerStatus: 'accepted',
                responseDate: new Date()
            };
        }

        await applicant.save();

        // Update job stats
        await updateJobStats(applicant.jobId);

        const populated = await Applicant.findById(applicant._id)
            .populate('jobId', 'jobTitle jobCode')
            .populate('assignedTo', 'name email');

        res.json({
            success: true,
            data: populated,
            message: `Status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Schedule interview
// @route   POST /api/applicants/:id/interviews
// @access  Private
const scheduleInterview = async (req, res) => {
    try {
        const {
            round,
            type,
            scheduledDate,
            duration,
            interviewers,
            location,
            meetingLink
        } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        applicant.interviews.push({
            round,
            type,
            scheduledDate,
            duration,
            interviewers,
            location,
            meetingLink,
            status: 'scheduled'
        });

        // Update applicant status
        if (applicant.status === 'shortlisted' || applicant.status === 'screening') {
            applicant.status = 'interview_scheduled';
        }

        await applicant.save();
        await updateJobStats(applicant.jobId);

        res.status(201).json({
            success: true,
            data: applicant.interviews[applicant.interviews.length - 1],
            message: 'Interview scheduled successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update interview
// @route   PUT /api/applicants/:id/interviews/:interviewId
// @access  Private
const updateInterview = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        const interview = applicant.interviews.id(req.params.interviewId);
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Interview not found'
            });
        }

        Object.assign(interview, req.body);
        await applicant.save();

        res.json({
            success: true,
            data: interview,
            message: 'Interview updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Send offer
// @route   POST /api/applicants/:id/offer
// @access  Private
const sendOffer = async (req, res) => {
    try {
        const {
            offeredSalary,
            offeredPosition,
            joiningDate,
            notes
        } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        applicant.offer = {
            offered: true,
            offerDate: new Date(),
            offeredSalary,
            offeredPosition,
            joiningDate,
            offerStatus: 'pending',
            notes
        };

        applicant.status = 'offered';
        await applicant.save();
        await updateJobStats(applicant.jobId);

        res.json({
            success: true,
            data: applicant,
            message: 'Offer sent successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add communication log
// @route   POST /api/applicants/:id/communications
// @access  Private
const addCommunication = async (req, res) => {
    try {
        const { type, subject, message } = req.body;

        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        applicant.communications.push({
            type,
            subject,
            message,
            sentBy: req.user.id,
            sentByName: req.user.name
        });

        applicant.lastContacted = new Date();

        await applicant.save();

        res.status(201).json({
            success: true,
            data: applicant.communications[applicant.communications.length - 1],
            message: 'Communication logged'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete applicant
// @route   DELETE /api/applicants/:id
// @access  Private (Admin)
const deleteApplicant = async (req, res) => {
    try {
        const applicant = await Applicant.findById(req.params.id);
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: 'Applicant not found'
            });
        }

        const jobId = applicant.jobId;
        await applicant.deleteOne();
        await updateJobStats(jobId);

        res.json({
            success: true,
            message: 'Applicant deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get applicant statistics
// @route   GET /api/applicants/stats
// @access  Private
const getApplicantStats = async (req, res) => {
    try {
        const total = await Applicant.countDocuments();

        const statusStats = await Applicant.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const sourceStats = await Applicant.aggregate([
            { $group: { _id: '$applicationSource', count: { $sum: 1 } } }
        ]);

        const departmentStats = await Applicant.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Average rating
        const ratingStats = await Applicant.aggregate([
            { $match: { rating: { $gt: 0 } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        // Recent applicants (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentApplicants = await Applicant.countDocuments({
            appliedDate: { $gte: sevenDaysAgo }
        });

        // Conversion rate
        const hired = await Applicant.countDocuments({ status: 'hired' });
        const conversionRate = total > 0 ? Math.round((hired / total) * 100 * 100) / 100 : 0;

        res.json({
            success: true,
            data: {
                total,
                recentApplicants,
                conversionRate,
                averageRating: Math.round((ratingStats[0]?.avgRating || 0) * 10) / 10,
                statusStats,
                sourceStats,
                departmentStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get applicant pipeline (kanban view)
// @route   GET /api/applicants/pipeline
// @access  Private
const getApplicantPipeline = async (req, res) => {
    try {
        const { jobId, department, assignedTo } = req.query;

        const query = {};
        if (jobId) query.jobId = jobId;
        if (department) query.department = department;
        if (assignedTo) query.assignedTo = assignedTo;

        const applicants = await Applicant.find(query)
            .populate('jobId', 'jobTitle jobCode')
            .populate('assignedTo', 'name email')
            .sort({ appliedDate: -1 });

        // Group by stage
        const pipeline = {
            applied: [],
            screening: [],
            interview: [],
            offer: [],
            hired: [],
            rejected: []
        };

        applicants.forEach(a => {
            if (pipeline[a.stage]) {
                pipeline[a.stage].push(a);
            }
        });

        res.json({
            success: true,
            data: {
                pipeline,
                stageCounts: Object.keys(pipeline).reduce((acc, key) => {
                    acc[key] = pipeline[key].length;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getApplicants,
    getApplicantsByJob,
    getApplicantById,
    createApplicant,
    updateApplicant,
    updateApplicantStatus,
    scheduleInterview,
    updateInterview,
    sendOffer,
    addCommunication,
    deleteApplicant,
    getApplicantStats,
    getApplicantPipeline
};