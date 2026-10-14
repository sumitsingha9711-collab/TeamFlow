import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// This file lives at server/src/config, so resolve from its own location rather
// than the process working directory. That keeps `npm run dev` aligned with the
// repository-level .env documented in the README.
const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, '../../../.env') });

const required = ['MONGODB_URI', 'SESSION_SECRET'];
export function env() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length && process.env.NODE_ENV === 'production')
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  return {
    port: Number(process.env.PORT || 4000),
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamflow',
    sessionSecret: process.env.SESSION_SECRET || 'development-only-change-me',
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    isProduction: process.env.NODE_ENV === 'production',
    demoUser: {
      enabled: process.env.DEMO_USER_ENABLED === 'true',
      name: process.env.DEMO_USER_NAME || 'TeamFlow Demo',
      email: (process.env.DEMO_USER_EMAIL || 'demo@teamflow.local').toLowerCase(),
      password: process.env.DEMO_USER_PASSWORD || 'DemoPassword123!',
    },
  };
}
