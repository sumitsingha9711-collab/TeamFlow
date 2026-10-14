import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Membership } from '../models/Membership.js';
export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env().clientOrigin, credentials: true },
  });
  io.use((socket, next) => {
    try {
      const cookie = socket.handshake.headers.cookie || '';
      const token = cookie
        .split(';')
        .map((x) => x.trim())
        .find((x) => x.startsWith('teamflow_session='))
        ?.split('=')[1];
      socket.userId = jwt.verify(token, env().sessionSecret).sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    socket.on('workspace:join', async (workspaceId) => {
      if (await Membership.exists({ workspaceId, userId: socket.userId }))
        socket.join(`workspace:${workspaceId}`);
    });
  });
  return io;
}
