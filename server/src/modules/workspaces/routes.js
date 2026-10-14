import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Workspace } from '../../models/Workspace.js';
import { Membership } from '../../models/Membership.js';
import { Invitation } from '../../models/Invitation.js';
import { User } from '../../models/User.js';
import { authenticate } from '../../middleware/authenticate.js';
import { workspaceAccess, requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { recordActivity } from '../../services/activityService.js';
const router = Router();
router.use(authenticate);
const workspaceInput = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({ userId: req.user.id }).populate(
      'workspaceId',
    );
    res.json({
      workspaces: memberships.map((m) => ({ ...m.workspaceId.toJSON(), role: m.role })),
    });
  }),
);
router.post(
  '/',
  validate(workspaceInput),
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.create({ ...req.body, ownerId: req.user.id });
    await Membership.create({
      workspaceId: workspace.id,
      userId: req.user.id,
      role: 'owner',
    });
    await recordActivity({
      workspaceId: workspace.id,
      actorId: req.user.id,
      action: 'created workspace',
      entityType: 'workspace',
      entityId: workspace.id,
    });
    res.status(201).json({ workspace, role: 'owner' });
  }),
);
router.get(
  '/:workspaceId',
  workspaceAccess((req) => req.params.workspaceId),
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace not found.');
    res.json({ workspace, role: req.membership.role });
  }),
);
router.patch(
  '/:workspaceId',
  workspaceAccess((req) => req.params.workspaceId),
  requireRole('owner', 'admin'),
  validate(workspaceInput.partial()),
  asyncHandler(async (req, res) => {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.workspaceId,
      req.body,
      { new: true, runValidators: true },
    );
    res.json({ workspace });
  }),
);
router.get(
  '/:workspaceId/members',
  workspaceAccess((req) => req.params.workspaceId),
  asyncHandler(async (req, res) => {
    const members = await Membership.find({
      workspaceId: req.params.workspaceId,
    }).populate('userId', 'name email');
    res.json({ members });
  }),
);
router.post(
  '/:workspaceId/invitations',
  workspaceAccess((req) => req.params.workspaceId),
  requireRole('owner', 'admin'),
  validate(
    z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'member']).default('member'),
    }),
  ),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const now = new Date();

    // TTL cleanup runs asynchronously, so remove expired records before checking
    // uniqueness or creating a replacement invitation.
    await Invitation.deleteMany({
      workspaceId: req.params.workspaceId,
      email,
      expiresAt: { $lte: now },
    });

    const invitedUser = await User.findOne({ email }).select('_id');
    if (invitedUser) {
      const membership = await Membership.exists({
        workspaceId: req.params.workspaceId,
        userId: invitedUser.id,
      });
      if (membership)
        throw new AppError(
          409,
          'ALREADY_A_MEMBER',
          'This user is already a workspace member.',
        );
    }

    const existingInvitation = await Invitation.exists({
      workspaceId: req.params.workspaceId,
      email,
      expiresAt: { $gt: now },
    });
    if (existingInvitation)
      throw new AppError(
        409,
        'INVITATION_ALREADY_PENDING',
        'An active invitation already exists for this email address.',
      );

    const token = crypto.randomBytes(32).toString('hex');
    let invitation;
    try {
      invitation = await Invitation.create({
        workspaceId: req.params.workspaceId,
        email,
        role: req.body.role,
        tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
        invitedBy: req.user.id,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError(
          409,
          'INVITATION_ALREADY_PENDING',
          'An active invitation already exists for this email address.',
        );
      throw error;
    }
    res.status(201).json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
      token,
    });
  }),
);
router.post(
  '/invitations/:token/accept',
  asyncHandler(async (req, res) => {
    const tokenHash = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const invitation = await Invitation.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    if (!invitation)
      throw new AppError(
        404,
        'INVITATION_INVALID',
        'This invitation is invalid or expired.',
      );
    if (invitation.email !== req.user.email)
      throw new AppError(
        403,
        'INVITATION_EMAIL_MISMATCH',
        'Sign in with the invited email address.',
      );
    await Membership.updateOne(
      { workspaceId: invitation.workspaceId, userId: req.user.id },
      { $setOnInsert: { role: invitation.role } },
      { upsert: true },
    );
    await invitation.deleteOne();
    res.status(204).end();
  }),
);
export default router;
