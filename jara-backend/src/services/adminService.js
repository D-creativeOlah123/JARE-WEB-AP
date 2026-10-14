import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Transfer } from '../models/Transfer.js';
import { ServiceTransaction } from '../models/ServiceTransaction.js';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Group } from '../models/Group.js';
import { Contribution } from '../models/Contribution.js';
import { PlatformSettings } from '../models/PlatformSettings.js';

/**
 * Global admin search. Runs a handful of parallel indexed queries and
 * returns the top few hits in each category. Keep this cheap — it's called
 * from a live-typed search input.
 */
export async function globalSearch({ query, perGroup = 5 }) {
  const q = String(query || '').trim();
  if (q.length < 2) return { users: [], transfers: [], services: [], goals: [], groups: [] };

  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');   // escape regex meta
  const rx   = new RegExp(safe, 'i');
  const isObjectId = mongoose.isValidObjectId(q);

  const [users, transfers, services, goals, groups] = await Promise.all([
    User.find(
      { $or: [{ fullName: rx }, { email: rx }, { phone: rx }] },
      { fullName: 1, email: 1, phone: 1, role: 1, suspended: 1 },
    )
      .limit(perGroup)
      .lean(),

    Transfer.find(
      {
        $or: [
          { reference: rx },
          { 'toBank.accountName': rx },
          { 'toBank.accountNumber': rx },
          { remark: rx },
          ...(isObjectId ? [{ _id: q }, { fromUserId: q }, { toUserId: q }] : []),
        ],
      },
      { reference: 1, type: 1, status: 1, amount: 1, toBank: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(perGroup)
      .lean(),

    ServiceTransaction.find(
      {
        $or: [
          { reference: rx },
          { recipient: rx },
          { provider: rx },
          ...(isObjectId ? [{ _id: q }, { userId: q }] : []),
        ],
      },
      { reference: 1, type: 1, provider: 1, recipient: 1, amount: 1, status: 1, createdAt: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(perGroup)
      .lean(),

    SavingsGoal.find(
      {
        $or: [
          { name: rx },
          { category: rx },
          ...(isObjectId ? [{ _id: q }, { userId: q }] : []),
        ],
      },
      { name: 1, targetAmount: 1, savedAmount: 1, status: 1, category: 1 },
    )
      .limit(perGroup)
      .lean(),

    Group.find(
      {
        $or: [
          { name: rx },
          { inviteCode: rx },
          ...(isObjectId ? [{ _id: q }] : []),
        ],
      },
      { name: 1, inviteCode: 1, status: 1, members: 1 },
    )
      .limit(perGroup)
      .lean()
      .then((rows) => rows.map((g) => ({
        _id: g._id,
        name: g.name,
        inviteCode: g.inviteCode,
        status: g.status,
        memberCount: g.members?.length ?? 0,
      }))),
  ]);

  return { users, transfers, services, goals, groups };
}

/**
 * Aggregate summary for the admin dashboard header.
 * All amounts in kobo — frontend converts for display.
 */
export async function getSummary() {
  const [
    userCount, activeUsers24h,
    balanceSum,
    monthTransferSum, monthTransferCount,
    activeGoals, completedGoals,
    activeGroups,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ updatedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    Account.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]).then((r) => r[0]?.total ?? 0),
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const r = await Transfer.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return r[0]?.total ?? 0;
    })(),
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      return Transfer.countDocuments({ status: 'completed', createdAt: { $gte: monthStart } });
    })(),
    SavingsGoal.countDocuments({ status: 'active' }),
    SavingsGoal.countDocuments({ status: 'completed' }),
    Group.countDocuments({ status: 'active' }),
  ]);

  return {
    users: {
      total: userCount,
      activeLast24h: activeUsers24h,
    },
    deposits: {
      totalHeld: balanceSum,        // sum of all wallet balances
    },
    transfers: {
      monthVolume: monthTransferSum,
      monthCount: monthTransferCount,
    },
    goals: {
      active: activeGoals,
      completed: completedGoals,
    },
    groups: {
      active: activeGroups,
    },
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function listUsers({ query, role, limit = 25, cursor } = {}) {
  const q = {};
  if (role) q.role = role;
  if (query) {
    const rx = new RegExp(String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }
  if (cursor) q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };

  const items = await User.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  return {
    users: rows,
    nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null,
  };
}

export async function getUserDetail(id) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid user id'); err.status = 400; throw err;
  }
  const user = await User.findById(id).select('+bvn');
  if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

  const [account, transferCount, goalCount, groupCount] = await Promise.all([
    Account.findOne({ userId: id }).lean(),
    Transfer.countDocuments({ $or: [{ fromUserId: id }, { toUserId: id }] }),
    SavingsGoal.countDocuments({ userId: id }),
    Group.countDocuments({ 'members.userId': id }),
  ]);

  const json = user.toJSON();
  // BVN is scoped to admin — surface a masked form (last 3 digits).
  if (user.bvn) json.bvnMasked = `••••••••${user.bvn.slice(-3)}`;

  return {
    user: json,
    account: account
      ? { accountNumber: account.accountNumber, balance: account.balance, currency: account.currency }
      : null,
    counts: {
      transfers: transferCount,
      goals: goalCount,
      groups: groupCount,
    },
  };
}

export async function updateUser({ id, patch }) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid user id'); err.status = 400; throw err;
  }
  const allowed = {};
  if (patch.role !== undefined && ['customer', 'admin'].includes(patch.role)) {
    allowed.role = patch.role;
  }
  if (patch.emailVerified !== undefined) allowed.emailVerified = Boolean(patch.emailVerified);
  if (patch.phoneVerified !== undefined) allowed.phoneVerified = Boolean(patch.phoneVerified);
  // Simple soft-suspend flag piggybacking on a field so we don't need a
  // schema migration right now. If richer status is needed, add `status`
  // to the User model in a follow-up.
  if (patch.suspended !== undefined) allowed.suspended = Boolean(patch.suspended);

  const user = await User.findByIdAndUpdate(id, { $set: allowed }, { new: true });
  if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }
  return user;
}

// ---------------------------------------------------------------------------
// Transfers + services (cross-user ledgers with filters)
// ---------------------------------------------------------------------------

export async function listTransfers({ type, status, limit = 25, cursor } = {}) {
  const q = {};
  if (type)   q.type = type;
  if (status) q.status = status;
  if (cursor) q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };

  const items = await Transfer.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  return {
    transfers: rows,
    nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null,
  };
}

// ---------------------------------------------------------------------------
// Platform Settings (singleton)
// ---------------------------------------------------------------------------

export async function getPlatformSettings() {
  const s = await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global' } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return s;
}

export async function updatePlatformSettings({ patch, updatedBy }) {
  const set = { updatedBy };
  if (patch?.flags && typeof patch.flags === 'object') {
    for (const [k, v] of Object.entries(patch.flags)) {
      set[`flags.${k}`] = Boolean(v);
    }
  }
  if (patch?.limits && typeof patch.limits === 'object') {
    for (const [k, v] of Object.entries(patch.limits)) {
      const n = Number(v);
      if (Number.isFinite(n) && n >= 0) set[`limits.${k}`] = n;
    }
  }
  return PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $set: set },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
}

// ---------------------------------------------------------------------------
// Goals + Groups (cross-user directories)
// ---------------------------------------------------------------------------

export async function listGoals({ status, limit = 25, cursor } = {}) {
  const q = {};
  if (status) q.status = status;
  if (cursor) q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };

  const items = await SavingsGoal.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;

  // Hydrate owner names — one User query keyed by the userIds we saw.
  const ownerIds = [...new Set(rows.map((g) => String(g.userId)))];
  const owners = await User.find({ _id: { $in: ownerIds } }).select('fullName email').lean();
  const ownerById = new Map(owners.map((u) => [String(u._id), u]));

  const goals = rows.map((g) => ({
    ...g,
    owner: ownerById.get(String(g.userId)) || null,
  }));

  return {
    goals,
    nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null,
  };
}

export async function listGroupsAdmin({ status, limit = 25, cursor } = {}) {
  const q = {};
  if (status) q.status = status;
  if (cursor) q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };

  const items = await Group.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;

  const creatorIds = [...new Set(rows.map((g) => String(g.creatorId)))];
  const creators = await User.find({ _id: { $in: creatorIds } }).select('fullName email').lean();
  const creatorById = new Map(creators.map((u) => [String(u._id), u]));

  const groups = rows.map((g) => ({
    ...g,
    creator: creatorById.get(String(g.creatorId)) || null,
    memberCount: g.members?.length ?? 0,
  }));

  return {
    groups,
    nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null,
  };
}

// ---------------------------------------------------------------------------
// Analytics — real aggregates for the admin dashboard charts
// ---------------------------------------------------------------------------

const CATEGORY_PALETTE = ['#EC4899', '#3B82F6', '#10B981', '#F97316', '#A855F7', '#22C55E', '#F59E0B'];

/**
 * Time-series analytics for the admin dashboard. `period` controls the
 * window of the monthly performance chart and the "active" filter for
 * the top-goals block.
 */
export async function getAnalytics({ period = 'month' } = {}) {
  // How many months of history to include in the monthly chart.
  const monthsBack = period === 'year' ? 12 : period === 'week' ? 3 : 7;

  // --- 1. Savings distribution: sum savedAmount per category (top 5) -------
  const distributionRaw = await SavingsGoal.aggregate([
    { $match: { status: { $in: ['active', 'completed'] } } },
    {
      $group: {
        _id: { $ifNull: ['$category', 'Other'] },
        total: { $sum: '$savedAmount' },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
  ]);
  const savingsDistribution = distributionRaw.map((row, i) => ({
    name: row._id && row._id.trim() ? row._id : 'Other',
    value: row.total,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));

  // --- 2. Top 3 active goals (biggest saved amount first) ------------------
  const goalsRaw = await SavingsGoal.find({ status: 'active' })
    .sort({ savedAmount: -1 })
    .limit(3)
    .lean();
  const activeGoals = goalsRaw.map((g, i) => ({
    id: String(g._id),
    name: g.name,
    saved: g.savedAmount,
    target: g.targetAmount,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));

  // --- 3. Monthly performance: contributions summed by month --------------
  const start = new Date();
  start.setMonth(start.getMonth() - (monthsBack - 1));
  start.setDate(1); start.setHours(0, 0, 0, 0);

  const monthlyRaw = await Contribution.aggregate([
    { $match: { createdAt: { $gte: start }, status: 'completed' } },
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        savings: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);
  const monthlyMap = new Map(
    monthlyRaw.map((r) => [`${r._id.y}-${r._id.m}`, r.savings]),
  );
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyPerformance = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const savings = monthlyMap.get(key) || 0;
    monthlyPerformance.push({
      month: monthNames[d.getMonth()],
      savings,
      target: 10_000_000,  // ₦100,000 baseline; can turn into user goal target later
    });
  }

  return { savingsDistribution, activeGoals, monthlyPerformance };
}

// ---------------------------------------------------------------------------
// Moderation queue — items that need admin attention
// ---------------------------------------------------------------------------

/**
 * Returns the two failing streams (transfers + service purchases) that
 * completed with `status: 'failed'` OR are stuck as `pending` for too long.
 * The frontend renders these as a single reverse-chronological feed.
 */
export async function getModerationQueue({ limit = 50 } = {}) {
  const staleAfter = new Date(Date.now() - 30 * 60 * 1000); // 30 mins

  const [failedTransfers, failedServices, staleTransfers, staleServices] = await Promise.all([
    Transfer.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(limit).lean(),
    ServiceTransaction.find({ status: 'failed' }).sort({ createdAt: -1 }).limit(limit).lean(),
    Transfer.find({ status: 'pending', createdAt: { $lt: staleAfter } })
      .sort({ createdAt: -1 }).limit(limit).lean(),
    ServiceTransaction.find({ status: 'pending', createdAt: { $lt: staleAfter } })
      .sort({ createdAt: -1 }).limit(limit).lean(),
  ]);

  const rows = [
    ...failedTransfers.map((r) => ({
      id: `t_${r._id}`, kind: 'transfer', severity: 'failed',
      title: `${r.type === 'bank' ? 'Bank transfer' : 'Jara transfer'} failed`,
      body: r.failureReason || 'No reason logged',
      amount: r.amount, reference: r.reference, createdAt: r.createdAt, userId: r.fromUserId,
    })),
    ...failedServices.map((r) => ({
      id: `s_${r._id}`, kind: 'service', severity: 'failed',
      title: `${r.type} purchase failed`,
      body: r.failureReason || 'No reason logged',
      amount: r.amount, reference: r.reference, createdAt: r.createdAt, userId: r.userId,
    })),
    ...staleTransfers.map((r) => ({
      id: `t_${r._id}`, kind: 'transfer', severity: 'stalled',
      title: `${r.type === 'bank' ? 'Bank transfer' : 'Jara transfer'} stalled in pending`,
      body: `Pending since ${new Date(r.createdAt).toISOString()}`,
      amount: r.amount, reference: r.reference, createdAt: r.createdAt, userId: r.fromUserId,
    })),
    ...staleServices.map((r) => ({
      id: `s_${r._id}`, kind: 'service', severity: 'stalled',
      title: `${r.type} purchase stalled in pending`,
      body: `Pending since ${new Date(r.createdAt).toISOString()}`,
      amount: r.amount, reference: r.reference, createdAt: r.createdAt, userId: r.userId,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    items: rows.slice(0, limit),
    summary: {
      failedTransfers: failedTransfers.length,
      failedServices: failedServices.length,
      staleTransfers: staleTransfers.length,
      staleServices: staleServices.length,
    },
  };
}

export async function listServiceTx({ type, status, limit = 25, cursor } = {}) {
  const q = {};
  if (type)   q.type = type;
  if (status) q.status = status;
  if (cursor) q._id = { $lt: new mongoose.Types.ObjectId(String(cursor)) };

  const items = await ServiceTransaction.find(q)
    .sort({ _id: -1 })
    .limit(Math.min(limit + 1, 101))
    .lean();

  const hasMore = items.length > limit;
  const rows = hasMore ? items.slice(0, limit) : items;
  return {
    transactions: rows,
    nextCursor: hasMore ? String(rows[rows.length - 1]._id) : null,
  };
}
