import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.teamflow_session;
  if (!token) throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
  try {
    const { sub } = jwt.verify(token, env().sessionSecret);
    const user = await User.findById(sub);
    if (!user) throw new Error('missing user');
    req.user = user;
    next();
  } catch {
    throw new AppError(
      401,
      'INVALID_SESSION',
      'Your session has expired. Please sign in again.',
    );
  }
});
export const sessionToken = (user) =>
  jwt.sign({ sub: user.id }, env().sessionSecret, { expiresIn: '8h' });
