import { SupportTicket } from '../models/SupportTicket.js';
import { User } from '../models/User.js';

export async function createTicket({ userId, subject, category, message, contact }) {
  const user = await User.findById(userId).select('email phone').lean();
  const t = await SupportTicket.create({
    userId,
    subject,
    category: category || 'other',
    message,
    contact: {
      email: contact?.email || user?.email || '',
      phone: contact?.phone || user?.phone || '',
    },
  });
  return t.toObject();
}

export async function listMyTickets(userId) {
  return SupportTicket.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
}

// ---------- admin ----------

export async function adminListTickets({ status, limit = 25, cursor } = {}) {
  const q = {};
  if (status) q.status = status;
  if (cursor) q._id = { $lt: cursor };

  const items = await SupportTicket.find(q)
    .populate('userId', 'fullName email phone')
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  return {
    tickets: hasMore ? items.slice(0, limit) : items,
    nextCursor: hasMore ? String(items[limit - 1]._id) : null,
  };
}

export async function adminUpdateTicket({ ticketId, adminId, status, resolution }) {
  const patch = {};
  if (status)     patch.status = status;
  if (resolution) patch.resolution = resolution;
  if (status === 'resolved') {
    patch.resolvedBy = adminId;
    patch.resolvedAt = new Date();
  }
  const updated = await SupportTicket.findByIdAndUpdate(ticketId, { $set: patch }, { new: true }).lean();
  if (!updated) {
    const err = new Error('Ticket not found');
    err.status = 404;
    throw err;
  }
  return updated;
}
