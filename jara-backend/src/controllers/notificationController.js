import {
  listMine,
  countUnread,
  markRead,
  markAllRead,
} from '../services/notificationService.js';

export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 30;
    const items = await listMine({ userId: req.user.id, limit });
    res.json({ notifications: items });
  } catch (err) { next(err); }
}

export async function unreadCount(req, res, next) {
  try {
    const count = await countUnread(req.user.id);
    res.json({ count });
  } catch (err) { next(err); }
}

export async function readOne(req, res, next) {
  try {
    await markRead({ userId: req.user.id, id: req.params.id });
    res.json({ read: true });
  } catch (err) { next(err); }
}

export async function readAll(req, res, next) {
  try {
    await markAllRead(req.user.id);
    res.json({ read: true });
  } catch (err) { next(err); }
}
