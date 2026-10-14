import { Notification } from '../models/Notification.js';

/**
 * Create a notification for a user. Never throws — a failed notification
 * write must never break the primary flow that triggered it. Callers use:
 *
 *   emit({ userId, type, title, body, meta }).catch(() => {})
 *
 * — but the internal try/catch means callers can also just `await` and forget.
 */
export async function emit({ userId, type, title, body, meta }) {
  try {
    await Notification.create({ userId, type, title, body, meta: meta || {} });
  } catch (err) {
    console.error('[notification:emit-failed]', err.message);
  }
}

export async function listMine({ userId, limit = 30 }) {
  return Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}

export async function countUnread(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

export async function markRead({ userId, id }) {
  const res = await Notification.updateOne(
    { _id: id, userId },
    { $set: { isRead: true, readAt: new Date() } },
  );
  if (res.matchedCount === 0) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } },
  );
}
