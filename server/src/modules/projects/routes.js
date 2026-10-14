import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../../models/Project.js';
import { Task } from '../../models/Task.js';
import { authenticate } from '../../middleware/authenticate.js';
import { workspaceAccess, requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { recordActivity } from '../../services/activityService.js';
const router = Router();
router.use(authenticate);
const input = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
});
router.get(
  '/workspaces/:workspaceId/projects',
  workspaceAccess((r) => r.params.workspaceId),
  asyncHandler(async (req, res) =>
    res.json({
      projects: await Project.find({
        workspaceId: req.params.workspaceId,
        status: { $ne: 'archived' },
      }).sort('-updatedAt'),
    }),
  ),
);
router.post(
  '/workspaces/:workspaceId/projects',
  workspaceAccess((r) => r.params.workspaceId),
  validate(input),
  asyncHandler(async (req, res) => {
    const project = await Project.create({
      ...req.body,
      workspaceId: req.params.workspaceId,
      createdBy: req.user.id,
    });
    await recordActivity({
      workspaceId: req.params.workspaceId,
      actorId: req.user.id,
      action: 'created project',
      entityType: 'project',
      entityId: project.id,
    });
    res.status(201).json({ project });
  }),
);
async function projectContext(req) {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new AppError(404, 'NOT_FOUND', 'Project not found.');
  req.project = project;
}
router.get(
  '/projects/:projectId',
  asyncHandler(projectContext),
  workspaceAccess((r) => r.project.workspaceId),
  (req, res) => res.json({ project: req.project }),
);
router.patch(
  '/projects/:projectId',
  asyncHandler(projectContext),
  workspaceAccess((r) => r.project.workspaceId),
  validate(input.partial().extend({ status: z.enum(['active', 'archived']).optional() })),
  asyncHandler(async (req, res) => {
    if (
      req.body.status === 'archived' &&
      !['owner', 'admin'].includes(req.membership.role)
    )
      throw new AppError(
        403,
        'INSUFFICIENT_ROLE',
        'Only workspace owners and admins may archive projects.',
      );
    Object.assign(req.project, req.body);
    if (req.body.status === 'archived') req.project.archivedAt = new Date();
    await req.project.save();
    res.json({ project: req.project });
  }),
);
router.delete(
  '/projects/:projectId',
  asyncHandler(projectContext),
  workspaceAccess((r) => r.project.workspaceId),
  requireRole('owner', 'admin'),
  asyncHandler(async (req, res) => {
    await Task.deleteMany({ projectId: req.project.id });
    await req.project.deleteOne();
    res.status(204).end();
  }),
);
export default router;
