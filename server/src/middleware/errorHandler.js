import { AppError } from '../utils/AppError.js';
export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}
export function errorHandler(error, req, res, next) {
  const status = error.status || (error.name === 'ValidationError' ? 422 : 500);
  const code = error.code || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  if (status >= 500) console.error(error);
  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? 'An unexpected error occurred.' : error.message,
      details: error.details || [],
    },
  });
}
