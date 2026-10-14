import mongoose from 'mongoose';
import { randomBytes, randomInt } from 'node:crypto';
import { Group } from '../models/Group.js';
import { Contribution } from '../models/Contribution.js';
import { Account } from '../models/Account.js';
import { User } from '../models/User.js';
import { comparePassword } from '../utils/hash.js';
import { emit as emitNotification } from './notificationService.js';

const ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789';   // no 0/O/1/I to avoid confusion

function generateReference() {
  return `GG${randomBytes(6).toString('hex').toUpperCase()}`;
}

function generateInviteCode() {
  let s = '';
  for (let i = 0; i < 7; i++) s += ALPHABET[randomInt(0, ALPHABET.length)];
  return s;
}

/**
 * Try a few times to generate a unique invite code — 32^7 ≈ 34 billion, so
 * collisions are astronomically unlikely, but we retry anyway.
 */
async function nextInviteCode(session) {
  for (let i = 0; i < 5; i++) {
    const code = generateInviteCode();
    const exists = await Group.exists({ inviteCode: code }).session(session ?? null);
    if (!exists) return code;
  }
  const err = new Error('Could not generate a unique invite code');
  err.status = 500;
  throw err;
}

// ---------------------------------------------------------------------------
// Create / read / cancel
// ---------------------------------------------------------------------------

export async function createGroup({
  creatorId,
  name,
  description,
  targetAmountNaira,
  individualContributionNaira,
  contributionFrequency,
  groupType,
  targetDate,
  rules,
}) {
  if (!Number.isFinite(targetAmountNaira) || targetAmountNaira <= 0) {
    const err = new Error('targetAmountNaira must be a positive number');
    err.status = 400;
    throw err;
  }
  const target = Math.round(targetAmountNaira * 100);
  const individual = Math.round((Number(individualContributionNaira) || 0) * 100);

  const parsedTarget = new Date(targetDate);
  if (Number.isNaN(parsedTarget.getTime()) || parsedTarget <= new Date()) {
    const err = new Error('targetDate must be a future date');
    err.status = 400;
    throw err;
  }

  const inviteCode = await nextInviteCode();

  return Group.create({
    creatorId,
    name,
    description: description || '',
    inviteCode,
    targetAmount: target,
    savedAmount: 0,
    individualContribution: individual,
    contributionFrequency: contributionFrequency || 'monthly',
    groupType: groupType || 'pooled',
    targetDate: parsedTarget,
    rules: rules || '',
    members: [{ userId: creatorId, joinedAt: new Date(), contributedAmount: 0 }],
  });
}

export async function listMyGroups(userId) {
  return Group.find({ 'members.userId': userId })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getGroup({ userId, groupId }) {
  const group = await Group.findById(groupId).lean();
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  const isMember = group.members.some((m) => String(m.userId) === String(userId));
  if (!isMember) {
    const err = new Error('You are not a member of this group');
    err.status = 403;
    throw err;
  }

  // Hydrate member display names
  const memberIds = group.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } }).select('fullName').lean();
  const nameById = new Map(users.map((u) => [String(u._id), u.fullName]));
  const members = group.members.map((m) => ({
    ...m,
    fullName: nameById.get(String(m.userId)) || 'Jara Customer',
  }));

  const contributions = await Contribution.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { group: { ...group, members }, contributions };
}

/**
 * Public preview by invite code — used before the user commits to joining.
 * Doesn't leak more than name + target + members count.
 */
export async function lookupByCode(inviteCode) {
  const g = await Group.findOne({ inviteCode: String(inviteCode || '').toUpperCase() }).lean();
  if (!g) {
    const err = new Error('Group not found for that code');
    err.status = 404;
    throw err;
  }
  return {
    id: g._id,
    name: g.name,
    description: g.description,
    targetAmount: g.targetAmount,
    savedAmount: g.savedAmount,
    individualContribution: g.individualContribution,
    contributionFrequency: g.contributionFrequency,
    targetDate: g.targetDate,
    memberCount: g.members.length,
    status: g.status,
  };
}

export async function joinGroup({ userId, inviteCode }) {
  const code = String(inviteCode || '').toUpperCase();
  const group = await Group.findOne({ inviteCode: code });
  if (!group) {
    const err = new Error('Group not found for that code');
    err.status = 404;
    throw err;
  }
  if (group.status !== 'active') {
    const err = new Error('Group is not accepting new members');
    err.status = 400;
    throw err;
  }
  const already = group.members.some((m) => String(m.userId) === String(userId));
  if (already) {
    const err = new Error('You are already a member of this group');
    err.status = 409;
    throw err;
  }

  group.members.push({ userId, joinedAt: new Date(), contributedAmount: 0 });
  await group.save();

  emitNotification({
    userId,
    type: 'group',
    title: `Joined ${group.name}`,
    body: 'Start contributing anytime from the group dashboard.',
    meta: { groupId: String(group._id), link: `/groups/${group._id}` },
  });

  return group;
}

export async function cancelGroup({ userId, groupId }) {
  const group = await Group.findById(groupId);
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  if (String(group.creatorId) !== String(userId)) {
    const err = new Error('Only the group creator can cancel');
    err.status = 403;
    throw err;
  }
  if (group.status !== 'active') {
    const err = new Error('Group is not active');
    err.status = 400;
    throw err;
  }
  group.status = 'cancelled';
  await group.save();
  return group;
}

// ---------------------------------------------------------------------------
// Contribute — the money-movement path
// ---------------------------------------------------------------------------

/**
 * A member contributes to their group from wallet.
 * Mirrors goal-contribute: session-wrapped debit + increment + ledger insert.
 */
export async function contributeToGroup({
  userId,
  groupId,
  amountKobo,
  pin,
  source = 'wallet',
}) {
  if (source !== 'wallet') {
    const err = new Error('Only wallet contributions are supported yet');
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    const err = new Error('Amount must be a positive integer (kobo)');
    err.status = 400;
    throw err;
  }
  if (!/^\d{4}$/.test(String(pin ?? ''))) {
    const err = new Error('4-digit transfer PIN is required');
    err.status = 400;
    throw err;
  }

  // Verify PIN outside the session.
  const user = await User.findById(userId).select('+transferPinHash');
  if (!user?.transferPinHash) {
    const err = new Error('Transfer PIN not set for this account');
    err.status = 400;
    throw err;
  }
  const pinOk = await comparePassword(String(pin), user.transferPinHash);
  if (!pinOk) {
    const err = new Error('Invalid transfer PIN');
    err.status = 401;
    throw err;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }
    if (group.status !== 'active') {
      const err = new Error('Group is not active');
      err.status = 400;
      throw err;
    }
    const memberIndex = group.members.findIndex((m) => String(m.userId) === String(userId));
    if (memberIndex === -1) {
      const err = new Error('You are not a member of this group');
      err.status = 403;
      throw err;
    }

    // Cap so we never overshoot the target.
    const remaining = group.targetAmount - group.savedAmount;
    if (remaining <= 0) {
      const err = new Error('Group target already fully funded');
      err.status = 400;
      throw err;
    }
    const contribution = Math.min(amountKobo, remaining);

    // Debit wallet (races blocked by $gte guard).
    const debit = await Account.updateOne(
      { userId, balance: { $gte: contribution } },
      { $inc: { balance: -contribution } },
      { session },
    );
    if (debit.matchedCount === 0) {
      const err = new Error('Insufficient wallet balance');
      err.status = 400;
      throw err;
    }

    const willComplete = group.savedAmount + contribution >= group.targetAmount;

    // Increment group savedAmount + this member's contributedAmount atomically.
    const setStatus = willComplete ? { status: 'completed' } : {};
    await Group.updateOne(
      { _id: group._id },
      {
        $inc: {
          savedAmount: contribution,
          [`members.${memberIndex}.contributedAmount`]: contribution,
        },
        $set: setStatus,
      },
      { session },
    );

    const [rec] = await Contribution.create(
      [{
        userId,
        groupId: group._id,
        amount: contribution,
        source,
        reference: generateReference(),
        status: 'completed',
      }],
      { session },
    );

    await session.commitTransaction();

    // Notify the contributor.
    emitNotification({
      userId,
      type: willComplete ? 'group' : 'contribution',
      title: willComplete
        ? `Group goal reached: ${group.name}`
        : `Contributed ${(contribution / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} to ${group.name}`,
      body: `Ref ${rec.reference}`,
      meta: { groupId: String(group._id), link: `/groups/${group._id}` },
    });
    // On completion, notify every OTHER member too.
    if (willComplete) {
      const otherIds = group.members
        .map((m) => m.userId)
        .filter((uid) => String(uid) !== String(userId));
      for (const otherId of otherIds) {
        emitNotification({
          userId: otherId,
          type: 'group',
          title: `Group goal reached: ${group.name}`,
          body: 'The circle has fully funded the target 🎉',
          meta: { groupId: String(group._id), link: `/groups/${group._id}` },
        });
      }
    }

    return {
      contribution: rec,
      savedAfter: group.savedAmount + contribution,
      completed: willComplete,
      capped: contribution < amountKobo,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listGroupContributions({ userId, groupId, limit = 20 }) {
  const group = await Group.findById(groupId).select('members').lean();
  if (!group) {
    const err = new Error('Group not found');
    err.status = 404;
    throw err;
  }
  const isMember = group.members.some((m) => String(m.userId) === String(userId));
  if (!isMember) {
    const err = new Error('You are not a member of this group');
    err.status = 403;
    throw err;
  }
  return Contribution.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}
