import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Account } from '../models/Account.js';
import { Transfer } from '../models/Transfer.js';
import { User } from '../models/User.js';
import { comparePassword } from '../utils/hash.js';
import { saveJaraBeneficiary } from './beneficiaryService.js';
import { Beneficiary } from '../models/Beneficiary.js';
import { findBankByCode } from '../data/nigerianBanks.js';
import { resolveAccount, initiateTransfer, isConfigured as paystackConfigured } from './paystackClient.js';
import { emit as emitNotification } from './notificationService.js';

/** Short unique-ish reference: JR + 10 base36 chars. */
function generateReference() {
  return `JR${randomBytes(6).toString('hex').toUpperCase()}`;
}

/**
 * Look up a Jara recipient by account number. Returns the account +
 * account holder's name — used by the frontend to display "Recipient:
 * MERCY KOGBEREGBE" before the user commits.
 */
export async function quoteJaraTransfer({ toAccountNumber, fromUserId }) {
  if (!/^\d{10}$/.test(String(toAccountNumber))) {
    const err = new Error('Account number must be 10 digits');
    err.status = 400;
    throw err;
  }

  const account = await Account.findOne({ accountNumber: toAccountNumber });
  if (!account) {
    const err = new Error('Recipient account not found');
    err.status = 404;
    throw err;
  }

  if (fromUserId && account.userId.equals(fromUserId)) {
    const err = new Error('You cannot transfer to your own account');
    err.status = 400;
    throw err;
  }

  const user = await User.findById(account.userId).select('fullName');
  return {
    accountNumber: account.accountNumber,
    accountName: user?.fullName || 'Jara Customer',
  };
}

/**
 * Execute a Jara-to-Jara transfer atomically.
 *
 * All money-touching operations run inside a Mongoose session/transaction
 * so a failure at any step rolls back debit + credit + ledger insert as
 * one unit. This is why we chose Mongo Atlas (replica set) up front —
 * single-node Mongo cannot do this.
 */
export async function executeJaraTransfer({
  fromUserId,
  toAccountNumber,
  amountKobo,
  remark,
  pin,
}) {
  // 1. Cheap validation before spending resources.
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
  if (!/^\d{10}$/.test(String(toAccountNumber))) {
    const err = new Error('Recipient account number must be 10 digits');
    err.status = 400;
    throw err;
  }

  // 2. Verify PIN (outside the transaction — no money moves).
  const sender = await User.findById(fromUserId).select('+transferPinHash');
  if (!sender?.transferPinHash) {
    const err = new Error('Transfer PIN not set for this account');
    err.status = 400;
    throw err;
  }
  const pinOk = await comparePassword(String(pin), sender.transferPinHash);
  if (!pinOk) {
    const err = new Error('Invalid transfer PIN');
    err.status = 401;
    throw err;
  }

  // 3. Money movement inside a session + transaction.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fromAcct = await Account.findOne({ userId: fromUserId }).session(session);
    if (!fromAcct) {
      const err = new Error('Sender account not found');
      err.status = 404;
      throw err;
    }

    const toAcct = await Account.findOne({ accountNumber: toAccountNumber }).session(session);
    if (!toAcct) {
      const err = new Error('Recipient account not found');
      err.status = 404;
      throw err;
    }
    if (toAcct.userId.equals(fromUserId)) {
      const err = new Error('You cannot transfer to your own account');
      err.status = 400;
      throw err;
    }

    // 4. Debit sender — the `balance: { $gte: amount }` filter guarantees
    //    we never overdraw even under concurrent requests.
    const debit = await Account.updateOne(
      { _id: fromAcct._id, balance: { $gte: amountKobo } },
      { $inc: { balance: -amountKobo } },
      { session },
    );
    if (debit.matchedCount === 0) {
      const err = new Error('Insufficient balance');
      err.status = 400;
      throw err;
    }

    // 5. Credit recipient.
    await Account.updateOne(
      { _id: toAcct._id },
      { $inc: { balance: amountKobo } },
      { session },
    );

    // 6. Immutable ledger entry.
    const [transfer] = await Transfer.create(
      [{
        type: 'jara',
        fromUserId,
        fromAccountId: fromAcct._id,
        toUserId: toAcct.userId,
        toAccountId: toAcct._id,
        amount: amountKobo,
        remark: remark ?? '',
        status: 'completed',
        reference: generateReference(),
      }],
      { session },
    );

    await session.commitTransaction();

    // Auto-save the recipient after the transfer commits. Deliberately
    // outside the transaction so a beneficiary write can never affect
    // money movement, and awaited-but-safe (never throws).
    const recipient = await User.findById(toAcct.userId).select('fullName');
    const senderInfo = await User.findById(fromUserId).select('fullName');
    await saveJaraBeneficiary({
      userId: fromUserId,
      accountNumber: toAcct.accountNumber,
      accountName: recipient?.fullName || 'Jara Customer',
    });

    // Notifications — sender + receiver, non-blocking.
    emitNotification({
      userId: fromUserId,
      type: 'transfer',
      title: `Sent ${(amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}`,
      body: `To ${recipient?.fullName || 'a Jara customer'} · ref ${transfer.reference}`,
      meta: { transferId: String(transfer._id), link: '/transactions' },
    });
    emitNotification({
      userId: toAcct.userId,
      type: 'transfer',
      title: `Received ${(amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}`,
      body: `From ${senderInfo?.fullName || 'a Jara customer'} · ref ${transfer.reference}`,
      meta: { transferId: String(transfer._id), link: '/transactions' },
    });

    return transfer;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * List a user's recent transfers, newest first. Cursor pagination via
 * ?cursor=<ISO date> could be added later; for now a simple limit is
 * enough for the frontend history view.
 */
/**
 * Ask Paystack (or the stub) to resolve an account number → holder's name.
 * Rejects unknown bank codes upfront.
 */
export async function verifyBankAccount({ bankCode, accountNumber }) {
  if (!/^\d{10}$/.test(String(accountNumber))) {
    const err = new Error('Account number must be 10 digits');
    err.status = 400;
    throw err;
  }
  const bank = findBankByCode(bankCode);
  if (!bank) {
    const err = new Error('Unknown bank');
    err.status = 400;
    throw err;
  }
  const resolved = await resolveAccount({ bankCode: bank.code, accountNumber });
  return {
    accountNumber: resolved.accountNumber,
    accountName:   resolved.accountName,
    bankCode:      bank.code,
    bankName:      bank.name,
    mode:          resolved.mode,
  };
}

/**
 * Execute a bank transfer. Same session-transaction pattern as jara —
 * the wallet debit + ledger insert are atomic. The external provider
 * call happens AFTER commit so a provider failure never leaves the
 * database in a torn state (we mark the transfer failed instead).
 *
 * In stub mode we mark status='completed'. Once you drop a real Paystack
 * key in, switch the initial status to 'pending' and complete via webhook.
 */
export async function executeBankTransfer({
  fromUserId,
  bankCode,
  accountNumber,
  accountName,   // pre-verified by the client via /transfers/bank/verify
  amountKobo,
  remark,
  pin,
}) {
  // --- cheap validation ---
  if (!Number.isInteger(amountKobo) || amountKobo <= 0) {
    const err = new Error('Amount must be a positive integer (kobo)');
    err.status = 400; throw err;
  }
  if (!/^\d{4}$/.test(String(pin ?? ''))) {
    const err = new Error('4-digit transfer PIN is required');
    err.status = 400; throw err;
  }
  if (!/^\d{10}$/.test(String(accountNumber))) {
    const err = new Error('Account number must be 10 digits');
    err.status = 400; throw err;
  }
  const bank = findBankByCode(bankCode);
  if (!bank) { const err = new Error('Unknown bank'); err.status = 400; throw err; }

  // --- verify PIN outside session ---
  const sender = await User.findById(fromUserId).select('+transferPinHash');
  if (!sender?.transferPinHash) {
    const err = new Error('Transfer PIN not set'); err.status = 400; throw err;
  }
  const pinOk = await comparePassword(String(pin), sender.transferPinHash);
  if (!pinOk) {
    const err = new Error('Invalid transfer PIN'); err.status = 401; throw err;
  }

  // --- money movement in a session ---
  const session = await mongoose.startSession();
  session.startTransaction();
  let transfer;
  try {
    const fromAcct = await Account.findOne({ userId: fromUserId }).session(session);
    if (!fromAcct) {
      const err = new Error('Sender account not found'); err.status = 404; throw err;
    }

    const debit = await Account.updateOne(
      { _id: fromAcct._id, balance: { $gte: amountKobo } },
      { $inc: { balance: -amountKobo } },
      { session },
    );
    if (debit.matchedCount === 0) {
      const err = new Error('Insufficient balance'); err.status = 400; throw err;
    }

    const [row] = await Transfer.create(
      [{
        type: 'bank',
        fromUserId,
        fromAccountId: fromAcct._id,
        toBank: {
          bankCode: bank.code,
          bankName: bank.name,
          accountNumber,
          accountName,
        },
        amount: amountKobo,
        remark: remark ?? '',
        // stub mode → completed instantly; live Paystack → keep 'pending',
        // let a webhook flip it. Toggle here when you wire the webhook.
        status: paystackConfigured ? 'pending' : 'completed',
        reference: generateReference(),
      }],
      { session },
    );

    await session.commitTransaction();
    transfer = row;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }

  // --- call the provider AFTER commit ---
  try {
    const providerResult = await initiateTransfer({
      amountKobo,
      bankCode: bank.code,
      accountNumber,
      accountName,
      reason: remark || 'Jara transfer',
    });
    // If the provider gave us its own reference, remember it — helpful for
    // reconciliation later. Never overwrite our own `reference`.
    await Transfer.updateOne(
      { _id: transfer._id },
      { $set: { providerReference: providerResult.reference } },
    );
  } catch (err) {
    // Provider failed. Mark the transfer failed and REFUND the wallet.
    console.error('[bank-transfer] provider call failed', err.message);
    const refundSession = await mongoose.startSession();
    refundSession.startTransaction();
    try {
      await Account.updateOne(
        { userId: fromUserId },
        { $inc: { balance: amountKobo } },
        { session: refundSession },
      );
      await Transfer.updateOne(
        { _id: transfer._id },
        { $set: { status: 'failed', failureReason: err.message.slice(0, 200) } },
        { session: refundSession },
      );
      await refundSession.commitTransaction();
    } catch (rollbackErr) {
      await refundSession.abortTransaction();
      // Both failed — log loudly. Manual reconciliation needed.
      console.error('[bank-transfer] refund FAILED', rollbackErr);
    } finally {
      refundSession.endSession();
    }
    const surface = new Error('Bank transfer failed. Your wallet was refunded.');
    surface.status = 502;
    throw surface;
  }

  // Bank transfer sender notification.
  emitNotification({
    userId: fromUserId,
    type: 'transfer',
    title: `Sent ${(amountKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })} to ${bank.name}`,
    body: `To ${accountName} · ref ${transfer.reference}`,
    meta: { transferId: String(transfer._id), link: '/transactions' },
  });

  // Auto-save the bank recipient as a beneficiary — same "seen you before" UX.
  try {
    await Beneficiary.updateOne(
      { userId: fromUserId, type: 'bank', accountNumber },
      {
        $setOnInsert: {
          userId: fromUserId,
          type: 'bank',
          accountNumber,
          accountName,
          bankCode: bank.code,
          bankName: bank.name,
        },
      },
      { upsert: true },
    );
  } catch { /* never let a beneficiary save undo a completed transfer */ }

  return transfer;
}

export async function listTransfers({ userId, limit = 20 }) {
  return Transfer.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}
