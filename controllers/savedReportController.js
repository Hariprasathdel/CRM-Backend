const SavedReport = require('../models/SavedReport');
const mongoose = require('mongoose');

// @desc    Get all saved reports
// @route   GET /api/saved-reports
// @access  Private
const getSavedReports = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            category,
            visibility,
            isFavorite,
            isArchived = false,
            isTemplate,
            search,
            tags,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            view = 'mine' // 'mine', 'shared', 'all'
        } = req.query;

        const query = {};

        // Filter based on view
        if (view === 'mine') {
            query.createdBy = req.user.id;
        } else if (view === 'shared') {
            query.createdBy = { $ne: req.user.id };
            query.$or = [
                { 'sharedWith.userId': req.user.id },
                { sharedWithRoles: req.user.role },
                { visibility: 'public' }
            ];
        } else {
            // 'all' - user can see own or shared
            query.$or = [
                { createdBy: req.user.id },
                { 'sharedWith.userId': req.user.id },
                { sharedWithRoles: req.user.role },
                { visibility: 'public' },
                { visibility: 'team' }
            ];
        }

        if (category) query.reportCategory = category;
        if (visibility) query.visibility = visibility;
        if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
        if (isArchived !== undefined) query.isArchived = isArchived === 'true';
        if (isTemplate !== undefined) query.isTemplate = isTemplate === 'true';
        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            query.tags = { $in: tagList };
        }

        if (search) {
            const searchQuery = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $regex: search, $options: 'i' } }
                ]
            };
            // Merge with existing $or if present
            if (query.$or) {
                query.$and = [
                    { $or: query.$or },
                    searchQuery
                ];
                delete query.$or;
            } else {
                Object.assign(query, searchQuery);
            }
        }

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const reports = await SavedReport.find(query)
            .populate('createdBy', 'name email role profileImage')
            .populate('updatedBy', 'name email')
            .populate('sharedWith.userId', 'name email role')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await SavedReport.countDocuments(query);

        res.json({
            success: true,
            data: reports,
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

// @desc    Get single saved report
// @route   GET /api/saved-reports/:id
// @access  Private
const getSavedReportById = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id)
            .populate('createdBy', 'name email role profileImage')
            .populate('updatedBy', 'name email')
            .populate('sharedWith.userId', 'name email role')
            .populate('runHistory.runBy', 'name email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        // Check access
        const isOwner = report.createdBy._id.toString() === req.user.id;
        const isSharedWithUser = report.sharedWith.some(
            s => s.userId && s.userId._id.toString() === req.user.id
        );
        const isSharedWithRole = report.sharedWithRoles.includes(req.user.role);
        const isPublic = report.visibility === 'public';

        if (!isOwner && !isSharedWithUser && !isSharedWithRole && !isPublic) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this report'
            });
        }

        res.json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create saved report
// @route   POST /api/saved-reports
// @access  Private
const createSavedReport = async (req, res) => {
    try {
        const {
            name,
            description,
            reportCategory,
            reportType,
            configuration,
            visibility,
            sharedWith,
            sharedWithDepartments,
            sharedWithRoles,
            schedule,
            tags,
            isTemplate,
            notes
        } = req.body;

        const report = await SavedReport.create({
            name,
            description,
            reportCategory,
            reportType,
            configuration: configuration || {},
            visibility: visibility || 'private',
            sharedWith: sharedWith || [],
            sharedWithDepartments: sharedWithDepartments || [],
            sharedWithRoles: sharedWithRoles || [],
            schedule: schedule || { enabled: false },
            tags: tags || [],
            isTemplate: isTemplate || false,
            notes,
            createdBy: req.user.id,
            createdByName: req.user.name
        });

        const populated = await SavedReport.findById(report._id)
            .populate('createdBy', 'name email role profileImage');

        res.status(201).json({
            success: true,
            data: populated,
            message: 'Report saved successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update saved report
// @route   PUT /api/saved-reports/:id
// @access  Private
const updateSavedReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        // Only owner or admin can update
        const isOwner = report.createdBy.toString() === req.user.id;
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            // Check if user has edit permission
            const shareEntry = report.sharedWith.find(
                s => s.userId && s.userId.toString() === req.user.id && s.permission === 'edit'
            );
            if (!shareEntry) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this report'
                });
            }
        }

        const updates = {
            ...req.body,
            updatedBy: req.user.id,
            updatedByName: req.user.name
        };

        // Prevent changing createdBy
        delete updates.createdBy;
        delete updates.createdByName;

        const updated = await SavedReport.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        )
        .populate('createdBy', 'name email role')
        .populate('sharedWith.userId', 'name email');

        res.json({
            success: true,
            data: updated,
            message: 'Saved report updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete saved report
// @route   DELETE /api/saved-reports/:id
// @access  Private
const deleteSavedReport = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        // Only owner or super admin can delete
        const isOwner = report.createdBy.toString() === req.user.id;
        const isSuperAdmin = req.user.role === 'super_admin';

        if (!isOwner && !isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only the owner or super admin can delete this report'
            });
        }

        await report.deleteOne();

        res.json({
            success: true,
            message: 'Saved report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle favorite status
// @route   PATCH /api/saved-reports/:id/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        report.isFavorite = !report.isFavorite;
        await report.save();

        res.json({
            success: true,
            data: { isFavorite: report.isFavorite },
            message: report.isFavorite ? 'Added to favorites' : 'Removed from favorites'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Archive/Unarchive saved report
// @route   PATCH /api/saved-reports/:id/archive
// @access  Private
const toggleArchive = async (req, res) => {
    try {
        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        // Only owner or admin
        const isOwner = report.createdBy.toString() === req.user.id;
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        report.isArchived = !report.isArchived;
        report.archivedAt = report.isArchived ? new Date() : null;
        await report.save();

        res.json({
            success: true,
            data: { isArchived: report.isArchived },
            message: report.isArchived ? 'Report archived' : 'Report unarchived'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Duplicate a saved report
// @route   POST /api/saved-reports/:id/duplicate
// @access  Private
const duplicateReport = async (req, res) => {
    try {
        const original = await SavedReport.findById(req.params.id);

        if (!original) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        const duplicateData = original.toObject();
        delete duplicateData._id;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;
        delete duplicateData.__v;
        delete duplicateData.runHistory;
        delete duplicateData.usageCount;

        duplicateData.name = `${original.name} (Copy)`;
        duplicateData.createdBy = req.user.id;
        duplicateData.createdByName = req.user.name;
        duplicateData.visibility = 'private';
        duplicateData.sharedWith = [];
        duplicateData.sharedWithDepartments = [];
        duplicateData.sharedWithRoles = [];
        duplicateData.isFavorite = false;
        duplicateData.isArchived = false;
        duplicateData.usageCount = 0;

        const duplicate = await SavedReport.create(duplicateData);

        const populated = await SavedReport.findById(duplicate._id)
            .populate('createdBy', 'name email role');

        res.status(201).json({
            success: true,
            data: populated,
            message: 'Report duplicated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Share saved report
// @route   POST /api/saved-reports/:id/share
// @access  Private
const shareReport = async (req, res) => {
    try {
        const { users, departments, roles, visibility } = req.body;

        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        // Only owner or admin
        const isOwner = report.createdBy.toString() === req.user.id;
        const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Only owner can share this report'
            });
        }

        if (visibility) report.visibility = visibility;
        if (users) report.sharedWith = users;
        if (departments) report.sharedWithDepartments = departments;
        if (roles) report.sharedWithRoles = roles;

        await report.save();

        const populated = await SavedReport.findById(report._id)
            .populate('sharedWith.userId', 'name email role');

        res.json({
            success: true,
            data: populated,
            message: 'Report shared successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Record report usage
// @route   POST /api/saved-reports/:id/run
// @access  Private
const recordReportRun = async (req, res) => {
    try {
        const { rowCount, executionTimeMs, status = 'success', errorMessage } = req.body;

        const report = await SavedReport.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Saved report not found'
            });
        }

        report.usageCount += 1;
        report.lastUsedAt = new Date();
        report.lastRunAt = new Date();

        report.runHistory.push({
            runAt: new Date(),
            runBy: req.user.id,
            runByName: req.user.name,
            rowCount,
            executionTimeMs,
            status,
            errorMessage
        });

        // Keep only last 50 run history entries
        if (report.runHistory.length > 50) {
            report.runHistory = report.runHistory.slice(-50);
        }

        await report.save();

        res.json({
            success: true,
            message: 'Report run recorded'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get saved report statistics
// @route   GET /api/saved-reports/stats
// @access  Private
const getSavedReportStats = async (req, res) => {
    try {
        // Only user's own reports by default
        const baseQuery = { createdBy: req.user.id };

        const total = await SavedReport.countDocuments(baseQuery);
        const favorites = await SavedReport.countDocuments({ ...baseQuery, isFavorite: true });
        const archived = await SavedReport.countDocuments({ ...baseQuery, isArchived: true });
        const scheduled = await SavedReport.countDocuments({ ...baseQuery, 'schedule.enabled': true });
        const templates = await SavedReport.countDocuments({ ...baseQuery, isTemplate: true });

        // By category
        const categoryStats = await SavedReport.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$reportCategory', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // By visibility
        const visibilityStats = await SavedReport.aggregate([
            { $match: baseQuery },
            { $group: { _id: '$visibility', count: { $sum: 1 } } }
        ]);

        // Most used reports
        const mostUsed = await SavedReport.find({ ...baseQuery, isArchived: false })
            .sort({ usageCount: -1 })
            .limit(5)
            .select('name reportCategory usageCount lastUsedAt');

        // Recently used
        const recentlyUsed = await SavedReport.find({
            ...baseQuery,
            lastUsedAt: { $ne: null }
        })
            .sort({ lastUsedAt: -1 })
            .limit(5)
            .select('name reportCategory usageCount lastUsedAt');

        // Reports shared with me
        const sharedWithMe = await SavedReport.countDocuments({
            createdBy: { $ne: req.user.id },
            $or: [
                { 'sharedWith.userId': req.user.id },
                { sharedWithRoles: req.user.role },
                { visibility: 'public' }
            ]
        });

        res.json({
            success: true,
            data: {
                total,
                favorites,
                archived,
                scheduled,
                templates,
                sharedWithMe,
                categoryStats,
                visibilityStats,
                mostUsed,
                recentlyUsed
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get favorite saved reports
// @route   GET /api/saved-reports/favorites
// @access  Private
const getFavoriteReports = async (req, res) => {
    try {
        const reports = await SavedReport.find({
            createdBy: req.user.id,
            isFavorite: true,
            isArchived: false
        })
            .populate('createdBy', 'name email')
            .sort({ updatedAt: -1 });

        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get recent saved reports
// @route   GET /api/saved-reports/recent
// @access  Private
const getRecentReports = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const reports = await SavedReport.find({
            createdBy: req.user.id,
            isArchived: false
        })
            .sort({ lastUsedAt: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .select('name reportCategory lastUsedAt createdAt usageCount');

        res.json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get saved reports shared with me
// @route   GET /api/saved-reports/shared-with-me
// @access  Private
const getSharedWithMe = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const query = {
            createdBy: { $ne: req.user.id },
            isArchived: false,
            $or: [
                { 'sharedWith.userId': req.user.id },
                { sharedWithRoles: req.user.role },
                { visibility: 'public' },
                { visibility: 'team' }
            ]
        };

        const reports = await SavedReport.find(query)
            .populate('createdBy', 'name email role profileImage')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort({ updatedAt: -1 });

        const total = await SavedReport.countDocuments(query);

        res.json({
            success: true,
            data: reports,
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

// @desc    Get templates
// @route   GET /api/saved-reports/templates
// @access  Private
const getTemplates = async (req, res) => {
    try {
        const { category } = req.query;

        const query = {
            isTemplate: true,
            isArchived: false,
            $or: [
                { createdBy: req.user.id },
                { visibility: 'public' },
                { sharedWithRoles: req.user.role }
            ]
        };

        if (category) query.reportCategory = category;

        const templates = await SavedReport.find(query)
            .populate('createdBy', 'name email')
            .sort({ usageCount: -1 });

        res.json({ success: true, data: templates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk delete saved reports
// @route   DELETE /api/saved-reports/bulk
// @access  Private
const bulkDeleteReports = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Report IDs array is required'
            });
        }

        // Only delete reports owned by user (or super admin)
        const query = {
            _id: { $in: ids }
        };

        if (req.user.role !== 'super_admin') {
            query.createdBy = req.user.id;
        }

        const result = await SavedReport.deleteMany(query);

        res.json({
            success: true,
            message: `${result.deletedCount} report(s) deleted successfully`,
            data: { deletedCount: result.deletedCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk archive/unarchive
// @route   PATCH /api/saved-reports/bulk-archive
// @access  Private
const bulkArchiveReports = async (req, res) => {
    try {
        const { ids, archive = true } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Report IDs array is required'
            });
        }

        const query = { _id: { $in: ids } };
        if (req.user.role !== 'super_admin') {
            query.createdBy = req.user.id;
        }

        const result = await SavedReport.updateMany(query, {
            $set: {
                isArchived: archive,
                archivedAt: archive ? new Date() : null
            }
        });

        res.json({
            success: true,
            message: `${result.modifiedCount} report(s) ${archive ? 'archived' : 'unarchived'}`,
            data: { modifiedCount: result.modifiedCount }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSavedReports,
    getSavedReportById,
    createSavedReport,
    updateSavedReport,
    deleteSavedReport,
    toggleFavorite,
    toggleArchive,
    duplicateReport,
    shareReport,
    recordReportRun,
    getSavedReportStats,
    getFavoriteReports,
    getRecentReports,
    getSharedWithMe,
    getTemplates,
    bulkDeleteReports,
    bulkArchiveReports
};