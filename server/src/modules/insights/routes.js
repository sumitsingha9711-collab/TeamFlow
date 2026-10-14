import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { workspaceAccess } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { Activity } from '../../models/Activity.js';
import { Notification } from '../../models/Notification.js';
import { Task } from '../../models/Task.js';
const router = Router();
router.use(authenticate);
router.get(
  '/workspaces/:workspaceId/activity',
  workspaceAccess((r) => r.params.workspaceId),
  asyncHandler(async (req, res) =>
    res.json({
      activity: await Activity.find({ workspaceId: req.params.workspaceId })
        .populate('actorId', 'name')
        .sort('-createdAt')
        .limit(50),
    }),
  ),
);
router.get(
  '/notifications',
  asyncHandler(async (req, res) =>
    res.json({
      notifications: await Notification.find({ recipientId: req.user.id })
        .sort('-createdAt')
        .limit(50),
    }),
  ),
);
router.patch(
  '/notifications/:notificationId/read',
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipientId: req.user.id },
      { readAt: new Date() },
      { new: true },
    );
    if (!notification)
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Notification not found.', details: [] },
      });
    res.json({ notification });
  }),
);
router.get(
  '/workspaces/:workspaceId/analytics',
  workspaceAccess((r) => r.params.workspaceId),
  asyncHandler(async (req, res) => {
    const tasks = await Task.find({ workspaceId: req.params.workspaceId });
    const byStatus = Object.fromEntries(
      ['todo', 'in_progress', 'in_review', 'done'].map((status) => [
        status,
        tasks.filter((task) => task.status === status).length,
      ]),
    );
    const now = new Date();
    res.json({
      totals: {
        all: tasks.length,
        completed: byStatus.done,
        pending: tasks.length - byStatus.done,
        overdue: tasks.filter(
          (task) => task.dueDate && task.dueDate < now && task.status !== 'done',
        ).length,
      },
      byStatus,
    });
  }),
);
export default router;
