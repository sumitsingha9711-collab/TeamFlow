import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { seedDemoUser } from './services/demoUserService.js';
import { createSocketServer } from './sockets/index.js';
const config = env();
const app = createApp();
const server = http.createServer(app);
const io = createSocketServer(server);
app.set('io', io);
connectDatabase(config.mongoUri)
  .then(async () => {
    await seedDemoUser(config);
    server.listen(config.port, () =>
      console.log(`TeamFlow API listening on ${config.port}`),
    );
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
