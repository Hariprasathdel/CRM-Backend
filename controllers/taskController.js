const Task = require('../models/Task');
const Employee = require('../models/Employee');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            assignedTo,
            project,
            department,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (assignedTo) query.assignedTo = assignedTo;
        if (project) query.project = project;
        if (department) query.department = department;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { taskCode: { $regex: search, $options: 'i' } }
            ];
        }

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email department position profileImage')
            .populate('assignedBy', 'name email')
            .populate('createdBy', 'name email')
            .populate('project', 'name code')
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .sort(sort);

        const total = await Task.countDocuments(query);

        res.json({
            success: true,
            data: tasks,
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

// @desc    Get tasks by status (kanban board)
// @route   GET /api/tasks/board
// @access  Private
const getTaskBoard = async (req, res) => {
    try {
        const { project, department, assignedTo } = req.query;

        const query = {};
        if (project) query.project = project;
        if (department) query.department = department;
        if (assignedTo) query.assignedTo = assignedTo;

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email department position profileImage')
            .populate('createdBy', 'name email')
            .populate('project', 'name code')
            .sort({ order: 1, createdAt: -1 });

        // Group tasks by status for kanban board
        const board = {
            backlog: [],
            todo: [],
            in_progress: [],
            review: [],
            testing: [],
            completed: [],
            blocked: [],
            cancelled: []
        };

        tasks.forEach(task => {
            if (board[task.status]) {
                board[task.status].push(task);
            }
        });

        res.json({
            success: true,
            data: {
                board,
                totalTasks: tasks.length,
                statusCounts: Object.keys(board).reduce((acc, key) => {
                    acc[key] = board[key].length;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email department position profileImage')
            .populate('assignedBy', 'name email')
            .populate('createdBy', 'name email')
            .populate('project', 'name code')
            .populate('parentTask', 'title taskCode')
            .populate('subtasks', 'title taskCode status');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        res.json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            project,
            department,
            assignedTo,
            status,
            priority,
            type,
            startDate,
            dueDate,
            estimatedHours,
            tags,
            checklist,
            parentTask,
            order,
            projectName
        } = req.body;

        // Get employee names for assignedTo IDs
        let assignedToNames = [];
        if (assignedTo && assignedTo.length > 0) {
            const employees = await Employee.find({ _id: { $in: assignedTo } });
            assignedToNames = employees.map(e => e.name);
        }

        const task = await Task.create({
            title,
            description,
            project,
            projectName,
            department,
            assignedTo: assignedTo || [],
            assignedToNames,
            assignedBy: req.user.id,
            assignedByName: req.user.name,
            status: status || 'todo',
            priority: priority || 'medium',
            type: type || 'feature',
            startDate,
            dueDate,
            estimatedHours: estimatedHours || 0,
            tags: tags || [],
            checklist: checklist || [],
            parentTask,
            order: order || 0,
            createdBy: req.user.id
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email department position profileImage')
            .populate('createdBy', 'name email')
            .populate('project', 'name code');

        res.status(201).json({
            success: true,
            data: populatedTask,
            message: 'Task created successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const {
            title,
            description,
            project,
            projectName,
            department,
            assignedTo,
            status,
            priority,
            type,
            startDate,
            dueDate,
            estimatedHours,
            actualHours,
            progress,
            tags,
            checklist,
            order
        } = req.body;

        // Update assignedTo names if changed
        if (assignedTo) {
            const employees = await Employee.find({ _id: { $in: assignedTo } });
            task.assignedToNames = employees.map(e => e.name);
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.project = project || task.project;
        task.projectName = projectName || task.projectName;
        task.department = department || task.department;
        task.assignedTo = assignedTo || task.assignedTo;
        task.status = status || task.status;
        task.priority = priority || task.priority;
        task.type = type || task.type;
        task.startDate = startDate || task.startDate;
        task.dueDate = dueDate || task.dueDate;
        task.estimatedHours = estimatedHours !== undefined ? estimatedHours : task.estimatedHours;
        task.actualHours = actualHours !== undefined ? actualHours : task.actualHours;
        task.progress = progress !== undefined ? progress : task.progress;
        task.tags = tags || task.tags;
        task.checklist = checklist || task.checklist;
        task.order = order !== undefined ? order : task.order;

        const updatedTask = await task.save();

        const populatedTask = await Task.findById(updatedTask._id)
            .populate('assignedTo', 'name email department position profileImage')
            .populate('createdBy', 'name email')
            .populate('project', 'name code');

        res.json({
            success: true,
            data: populatedTask,
            message: 'Task updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update task status (for drag & drop)
// @route   PATCH /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
    try {
        const { status, order } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        task.status = status || task.status;
        if (order !== undefined) task.order = order;

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email department position profileImage');

        res.json({
            success: true,
            data: populatedTask,
            message: 'Task status updated'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if task has subtasks
        const subtaskCount = await Task.countDocuments({ parentTask: task._id });
        if (subtaskCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete task with ${subtaskCount} subtasks. Delete subtasks first.`
            });
        }

        await task.deleteOne();

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        task.comments.push({
            user: req.user.id,
            userName: req.user.name,
            text: text.trim()
        });

        await task.save();

        res.status(201).json({
            success: true,
            data: task.comments[task.comments.length - 1],
            message: 'Comment added'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete comment
// @route   DELETE /api/tasks/:taskId/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const comment = task.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Only allow comment author or admin to delete
        if (comment.user.toString() !== req.user.id && 
            req.user.role !== 'admin' && 
            req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }

        comment.deleteOne();
        await task.save();

        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle checklist item
// @route   PATCH /api/tasks/:taskId/checklist/:checklistId
// @access  Private
const toggleChecklistItem = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const item = task.checklist.id(req.params.checklistId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Checklist item not found'
            });
        }

        item.completed = !item.completed;
        await task.save();

        res.json({ success: true, data: task.checklist });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add time tracking entry
// @route   POST /api/tasks/:id/time
// @access  Private
const addTimeEntry = async (req, res) => {
    try {
        const { hours, description } = req.body;

        if (!hours || hours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Hours must be greater than 0'
            });
        }

        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        task.timeTracking.push({
            user: req.user.id,
            userName: req.user.name,
            hours,
            description
        });

        task.actualHours = (task.actualHours || 0) + hours;

        await task.save();

        res.status(201).json({
            success: true,
            data: task,
            message: 'Time entry added'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
    try {
        const total = await Task.countDocuments();

        const statusStats = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const priorityStats = await Task.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const typeStats = await Task.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const now = new Date();
        const overdueCount = await Task.countDocuments({
            dueDate: { $lt: now },
            status: { $nin: ['completed', 'cancelled'] }
        });

        const dueTodayCount = await Task.countDocuments({
            dueDate: {
                $gte: new Date(now.setHours(0, 0, 0, 0)),
                $lte: new Date(now.setHours(23, 59, 59, 999))
            },
            status: { $nin: ['completed', 'cancelled'] }
        });

        // Task completion rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const completedLast30 = await Task.countDocuments({
            status: 'completed',
            completedDate: { $gte: thirtyDaysAgo }
        });

        const createdLast30 = await Task.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        const completionRate = createdLast30 > 0
            ? Math.round((completedLast30 / createdLast30) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                total,
                overdueCount,
                dueTodayCount,
                completionRate,
                statusStats,
                priorityStats,
                typeStats
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get tasks assigned to me
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id })
            .populate('assignedBy', 'name email')
            .populate('project', 'name code')
            .sort({ dueDate: 1, priority: -1 });

        res.json({ success: true, data: tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reorder tasks (drag & drop within column)
// @route   POST /api/tasks/reorder
// @access  Private
const reorderTasks = async (req, res) => {
    try {
        const { tasks } = req.body; // Array of { id, order, status }

        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({
                success: false,
                message: 'Tasks array is required'
            });
        }

        const bulkOps = tasks.map(t => ({
            updateOne: {
                filter: { _id: t.id },
                update: { $set: { order: t.order, status: t.status || undefined } }
            }
        }));

        await Task.bulkWrite(bulkOps);

        res.json({
            success: true,
            message: 'Tasks reordered successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskBoard,
    getTaskById,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addComment,
    deleteComment,
    toggleChecklistItem,
    addTimeEntry,
    getTaskStats,
    getMyTasks,
    reorderTasks
};