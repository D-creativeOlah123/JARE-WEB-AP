import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Contribution } from '../models/Contribution.js';
import { Account } from '../models/Account.js';
import { User } from '../models/User.js';
import { comparePassword } from '../utils/hash.js';
import { emit as emitNotification } from './notificationService.js';

function generateReference() {
  return `GC${randomBytes(6).toString('hex').toUpperCase()}`;
}

/**
 * Create a personal savings goal. Amounts arrive in naira from the
 * frontend; we convert once here so the rest of the service is always
 * in kobo.
 */
export async function createGoal({
  userId,
  name,
  category,
  targetAmountNaira,
  startDate,
  endDate,
  savingFrequency,
  autoSaveEnabled,
  autoSaveAmountNaira,
  paymentMethod,
}) {
  if (!Number.isFinite(targetAmountNaira) || targetAmountNaira <= 0) {
    const err = new Error('targetAmountNaira must be a positive number');
    err.status = 400;
    throw err;
  }

  const targetAmount = Math.round(targetAmountNaira * 100);
  const autoSaveAmount = autoSaveAmountNaira
    ? Math.round(autoSaveAmountNaira * 100)
    : 0;

  const parsedEnd = new Date(endDate);
  const parsedStart = startDate ? new Date(startDate) : new Date();
  if (Number.isNaN(parsedEnd.getTime()) || parsedEnd <= parsedStart) {
    const err = new Error('endDate must be a date after startDate');
    err.status = 400;
    throw err;
  }

  return SavingsGoal.create({
    userId,
    name,
    category: category || '',
    targetAmount,
    savedAmount: 0,
    startDate: parsedStart,
    endDate: parsedEnd,
    savingFrequency: savingFrequency || 'manual',
    autoSaveEnabled: Boolean(autoSaveEnabled),
    autoSaveAmount,
    paymentMethod: paymentMethod || 'wallet',
  });
}

export async function listGoals(userId, { status } = {}) {
  const q = { userId };
  if (status) q.status = status;
  return SavingsGoal.find(q).sort({ createdAt: -1 }).lean();
}

export async function getGoal({ userId, goalId }) {
  const goal = await SavingsGoal.findOne({ _id: goalId, userId }).lean();
  if (!goal) {
    const err = new Error('Goal not found');
    err.status = 404;
    throw err;
  }
  const contributions = await Contribution.find({ goalId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return { goal, contributions };
}

/**
 * Update a subset of allowed fields. Never allow updates to savedAmount
 * or status through this endpoint — those are only touched by the
 * contribution flow (savedAmount, status) or by explicit cancel (status).
 */
export async function updateGoal({ userId, goalId, patch }) {
  const allowed = {};
  if (patch.name !== undefined) allowed.name = patch.name;
  if (patch.category !== undefined) allowed.category = patch.category;
  if (patch.endDate !== undefined) allowed.endDate = new Date(patch.endDate);
  if (patch.savingFrequency !== undefined) allowed.savingFrequency = patch.savingFrequency;
  if (patch.autoSaveEnabled !== undefined) allowed.autoSaveEnabled = Boolean(patch.autoSaveEnabled);
  if (patch.autoSaveAmountNaira !== undefined) {
    allowed.autoSaveAmount = Math.round(Number(patch.autoSaveAmountNaira) * 100);
  }

  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: goalId, userId },
    { $set: allowed },
    { new: true, runValidators: true },
  );
  if (!goal) {
    const err = new Error('Goal not found');
    err.status = 404;
    throw err;
  }
  return goal;
}

export async function cancelGoal({ userId, goalId }) {
  const goal = await SavingsGoal.findOneAndUpdate(
    { _id: goalId, userId, status: 'active' },
    { $set: { status: 'cancelled' } },
    { new: true },
  );
  if (!goal) {
    const err = new Error('Goal not found or already inactive');
    err.status = 404;
    throw err;
  }
  return goal;
}

/**
 * Contribute money from the user's wallet to a goal.
 * Mirrors executeJaraTransfer: session + transaction wraps debit +
 * goal update + Contribution insert. All-or-nothing.
 *
 * Only `wallet` source for step 6a — `bank` and `card` sources need real
 * provider integrations and come in later steps.
 */
export async function contributeToGoal({
  userId,
  goalId,
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

  // Verify PIN outside the transaction — no money moves here.
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
    // Load goal inside the session so an in-flight cancel/complete would
    // be visible to us.
    const goal = await SavingsGoal.findOne({ _id: goalId, userId }).session(session);
    if (!goal) {
      const err = new Error('Goal not found');
      err.status = 404;
      throw err;
    }
    if (goal.status !== 'active') {
      const err = new Error('Goal is not active');
      err.status = 400;
      throw err;
    }

    // Cap contribution so we never overshoot the target.
    const remaining = goal.targetAmount - goal.savedAmount;
    if (remaining <= 0) {
      const err = new Error('Goal already fully funded');
      err.status = 400;
      throw err;
    }
    const contributionAmount = Math.min(amountKobo, remaining);

    // Debit wallet — the balance guard blocks races against concurrent
    // withdrawals/transfers.
    const debit = await Account.updateOne(
      { userId, balance: { $gte: contributionAmount } },
      { $inc: { balance: -contributionAmount } },
      { session },
    );
    if (debit.matchedCount === 0) {
      const err = new Error('Insufficient wallet balance');
      err.status = 400;
      throw err;
    }

    // Increment goal.savedAmount, and complete it atomically if we hit target.
    const newSaved = goal.savedAmount + contributionAmount;
    const willComplete = newSaved >= goal.targetAmount;
    await SavingsGoal.updateOne(
      { _id: goal._id },
      {
        $inc: { savedAmount: contributionAmount },
        ...(willComplete ? { $set: { status: 'completed' } } : {}),
      },
      { session },
    );

    // Immutable ledger entry.
    const [contribution] = await Contribution.create(
      [{
        userId,
        goalId: goal._id,
        amount: contributionAmount,
        source,
        reference: generateReference(),
        status: 'completed',
      }],
      { session },
    );

    await session.commitTransaction();

    emitNotification({
      userId,
      type: willComplete ? 'goal' : 'contribution',
      title: willComplete
        ? `Goal reached: ${goal.name}`
        : `Added ${(contributionAmount / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} to ${goal.name}`,
      body: willComplete
        ? 'Congratulations — this goal is fully funded.'
        : `Ref ${contribution.reference}`,
      meta: { goalId: String(goal._id), link: `/my-jara/${goal._id}` },
    });

    return {
      contribution,
      completed: willComplete,
      savedAfter: newSaved,
      capped: contributionAmount < amountKobo,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function listGoalContributions({ userId, goalId, limit = 20 }) {
  const goal = await SavingsGoal.exists({ _id: goalId, userId });
  if (!goal) {
    const err = new Error('Goal not found');
    err.status = 404;
    throw err;
  }
  return Contribution.find({ goalId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}
