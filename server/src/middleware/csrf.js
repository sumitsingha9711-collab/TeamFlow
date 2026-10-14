import crypto from 'crypto';
import { AppError } from '../utils/AppError.js';
export function issueCsrfToken(res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('teamflow_csrf', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });
}
export function csrfProtection(req, res, next) {
  if (
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ||
    ['/api/v1/auth/login', '/api/v1/auth/register'].includes(req.path)
  )
    return next();
  if (!req.cookies.teamflow_csrf || req.get('x-csrf-token') !== req.cookies.teamflow_csrf)
    return next(
      new AppError(
        403,
        'CSRF_INVALID',
        'Your security token is missing or invalid. Refresh and try again.',
      ),
    );
  next();
}
