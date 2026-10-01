const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
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
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');
const { validateRequest } = require('../utils/validators');

// @route   GET /api/tasks
router.get('/', protect, getTasks);

// @route   GET /api/tasks/board
router.get('/board', protect, getTaskBoard);

// @route   GET /api/tasks/stats
router.get('/stats', protect, getTaskStats);

// @route   GET /api/tasks/my-tasks
router.get('/my-tasks', protect, getMyTasks);

// @route   POST /api/tasks/reorder
router.post('/reorder', protect, reorderTasks);

// @route   GET /api/tasks/:id
router.get('/:id', protect, getTaskById);

// @route   POST /api/tasks
router.post(
    '/',
    protect,
    [
        body('title')
            .notEmpty().withMessage('Task title is required')
            .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
            .trim(),
        body('status')
            .optional()
            .isIn(['backlog', 'todo', 'in_progress', 'review', 'testing', 'completed', 'blocked', 'cancelled'])
            .withMessage('Invalid status'),
        body('priority')
            .optional()
            .isIn(['low', 'medium', 'high', 'critical'])
            .withMessage('Invalid priority'),
        body('type')
            .optional()
            .isIn(['feature', 'bug', 'improvement', 'documentation', 'design', 'research', 'other'])
            .withMessage('Invalid type')
    ],
    validateRequest,
    createTask
);

// @route   PUT /api/tasks/:id
router.put('/:id', protect, updateTask);

// @route   PATCH /api/tasks/:id/status
router.patch('/:id/status', protect, updateTaskStatus);

// @route   DELETE /api/tasks/:id
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteTask);

// @route   POST /api/tasks/:id/comments
router.post(
    '/:id/comments',
    protect,
    [body('text').notEmpty().withMessage('Comment text is required')],
    validateRequest,
    addComment
);

// @route   DELETE /api/tasks/:taskId/comments/:commentId
router.delete('/:taskId/comments/:commentId', protect, deleteComment);

// @route   PATCH /api/tasks/:taskId/checklist/:checklistId
router.patch('/:taskId/checklist/:checklistId', protect, toggleChecklistItem);

// @route   POST /api/tasks/:id/time
router.post(
    '/:id/time',
    protect,
    [
        body('hours').isNumeric().withMessage('Hours must be a number').custom(v => v > 0).withMessage('Hours must be greater than 0')
    ],
    validateRequest,
    addTimeEntry
);

module.exports = router;