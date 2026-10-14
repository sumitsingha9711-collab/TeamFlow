import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './modules/auth/routes.js';
import workspaceRoutes from './modules/workspaces/routes.js';
import projectRoutes from './modules/projects/routes.js';
import taskRoutes from './modules/tasks/routes.js';
import insightRoutes from './modules/insights/routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { csrfProtection } from './middleware/csrf.js';
export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env().clientOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
    }),
    authRoutes,
  );
  app.use('/api/v1/workspaces', workspaceRoutes);
  app.use('/api/v1', projectRoutes, taskRoutes, insightRoutes);
  app.get('/api/v1/health', (req, res) => res.json({ ok: true }));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
