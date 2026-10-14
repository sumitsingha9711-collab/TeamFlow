import { Membership } from '../models/Membership.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const workspaceAccess = (getWorkspaceId) =>
  asyncHandler(async (req, res, next) => {
    const workspaceId = getWorkspaceId(req);
    const membership = await Membership.findOne({ workspaceId, userId: req.user.id });
    if (!membership)
      throw new AppError(403, 'FORBIDDEN', 'You do not have access to this workspace.');
    req.membership = membership;
    next();
  });
export const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.membership.role)
      ? next()
      : next(
          new AppError(
            403,
            'INSUFFICIENT_ROLE',
            'Your workspace role cannot perform this action.',
          ),
        );
