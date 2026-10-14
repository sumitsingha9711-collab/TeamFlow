import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../../models/Task.js';
import { Project } from '../../models/Project.js';
import { Membership } from '../../models/Membership.js';
import { authenticate } from '../../middleware/authenticate.js';
import { workspaceAccess } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { recordActivity, notify } from '../../services/activityService.js';
const router = Router();
router.use(authenticate);
const id = z.string().regex(/^[a-f\d]{24}$/i);
const input = z.object({
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: id.nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  position: z.number().nonnegative().optional(),
});
async function taskContext(req) {
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError(404, 'NOT_FOUND', 'Task not found.');
  req.task = task;
}
async function validAssignee(workspaceId, assigneeId) {
  if (assigneeId && !(await Membership.exists({ workspaceId, userId: assigneeId })))
    throw new AppError(422, 'INVALID_ASSIGNEE', 'Assignee must be a workspace member.');
}
router.get(
  '/projects/:projectId/tasks',
  asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found.');
    req.project = project;
    next();
  }),
  workspaceAccess((r) => r.project.workspaceId),
  asyncHandler(async (req, res) =>
    res.json({
      tasks: await Task.find({ projectId: req.params.projectId }).sort({
        status: 1,
        position: 1,
        createdAt: -1,
      }),
    }),
  ),
);
router.post(
  '/projects/:projectId/tasks',
  validate(input),
  asyncHandler(async (req, res, next) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found.');
    req.project = project;
    next();
  }),
  workspaceAccess((r) => r.project.workspaceId),
  asyncHandler(async (req, res) => {
    await validAssignee(req.project.workspaceId, req.body.assigneeId);
    const task = await Task.create({
      ...req.body,
      projectId: req.project.id,
      workspaceId: req.project.workspaceId,
      createdBy: req.user.id,
    });
    await recordActivity({
      workspaceId: task.workspaceId,
      actorId: req.user.id,
      action: 'created task',
      entityType: 'task',
      entityId: task.id,
    });
    req.app.get('io')?.to(`workspace:${task.workspaceId}`).emit('task:created', task);
    res.status(201).json({ task });
  }),
);
router.patch(
  '/tasks/:taskId',
  taskContext,
  workspaceAccess((r) => r.task.workspaceId),
  validate(input.partial()),
  asyncHandler(async (req, res) => {
    await validAssignee(req.task.workspaceId, req.body.assigneeId);
    const priorAssignee = String(req.task.assigneeId || '');
    Object.assign(req.task, req.body);
    await req.task.save();
    await recordActivity({
      workspaceId: req.task.workspaceId,
      actorId: req.user.id,
      action: 'updated task',
      entityType: 'task',
      entityId: req.task.id,
    });
    const io = req.app.get('io');
    io?.to(`workspace:${req.task.workspaceId}`).emit('task:updated', req.task);
    if (req.body.assigneeId && String(req.body.assigneeId) !== priorAssignee)
      await notify({
        recipientId: req.body.assigneeId,
        workspaceId: req.task.workspaceId,
        type: 'task_assigned',
        message: `You were assigned “${req.task.title}”.`,
        entityId: req.task.id,
        io,
      });
    res.json({ task: req.task });
  }),
);
router.delete(
  '/tasks/:taskId',
  taskContext,
  workspaceAccess((r) => r.task.workspaceId),
  asyncHandler(async (req, res) => {
    if (
      !['owner', 'admin'].includes(req.membership.role) &&
      String(req.task.createdBy) !== req.user.id
    )
      throw new AppError(
        403,
        'INSUFFICIENT_ROLE',
        'You can delete only tasks you created.',
      );
    await req.task.deleteOne();
    req.app
      .get('io')
      ?.to(`workspace:${req.task.workspaceId}`)
      .emit('task:deleted', { id: req.params.taskId });
    res.status(204).end();
  }),
);
export default router;
