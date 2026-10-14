import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../../models/User.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import { authenticate, sessionToken } from '../../middleware/authenticate.js';
import { env } from '../../config/env.js';
import { issueCsrfToken } from '../../middleware/csrf.js';
const router = Router();
const credentials = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});
const register = credentials.extend({ name: z.string().trim().min(2).max(80) });
function setSession(res, user) {
  res.cookie('teamflow_session', sessionToken(user), {
    httpOnly: true,
    secure: env().isProduction,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });
  issueCsrfToken(res);
}
router.post(
  '/register',
  validate(register),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email }))
      throw new AppError(
        409,
        'EMAIL_EXISTS',
        'An account already exists for this email address.',
      );
    const user = await User.create({
      name: req.body.name,
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12),
    });
    setSession(res, user);
    res.status(201).json({ user });
  }),
);
router.post(
  '/login',
  validate(credentials),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select(
      '+passwordHash',
    );
    if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    setSession(res, user);
    res.json({ user: user.toJSON() });
  }),
);
router.post('/logout', (req, res) => {
  res.clearCookie('teamflow_session');
  res.clearCookie('teamflow_csrf');
  res.status(204).end();
});
router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
export default router;
