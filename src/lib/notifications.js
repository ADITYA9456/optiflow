import logger from './logger';
import Notification from '@/models/Notification';

/**
 * Dispatches a notification record. Best-effort; never throws.
 * Also pushes to socket.io if the global instance is present.
 *
 * @param {Object} params
 * @param {string} params.userId          recipient user id (required)
 * @param {string} params.type            e.g. "mention", "task_assigned"
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {string} [params.link]          deep link path for the UI
 * @param {Object} [params.meta]
 */
export async function notify({ userId, type, title, body, link, meta } = {}) {
  if (!userId || !type || !title) return;
  try {
    const doc = await Notification.create({
      userId,
      type,
      title,
      body: body || '',
      link: link || '',
      meta: meta || {},
      isRead: false,
    });

    const io = globalThis.__optiflowSocketIO;
    if (io) {
      io.to(`user:${String(userId)}`).emit('notification:new', {
        notification: JSON.parse(JSON.stringify(doc)),
      });
    }
  } catch (error) {
    logger.warn('Notification dispatch failed', { type, error: error.message });
  }
}

export async function notifyMany(items) {
  if (!Array.isArray(items)) return;
  await Promise.all(items.map((item) => notify(item)));
}
