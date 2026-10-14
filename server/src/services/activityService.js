import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
export const recordActivity = (data) => Activity.create(data);
export async function notify({ recipientId, workspaceId, type, message, entityId, io }) {
  const notification = await Notification.create({
    recipientId,
    workspaceId,
    type,
    message,
    entityId,
  });
  io?.to(`user:${recipientId}`).emit('notification:created', notification);
  return notification;
}
