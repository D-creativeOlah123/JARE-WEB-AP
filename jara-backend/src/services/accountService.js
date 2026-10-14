import { randomInt } from 'node:crypto';
import { Account } from '../models/Account.js';

/**
 * Generate a unique 10-digit account number starting with 9 (Jara prefix).
 * Retries on collision — in practice the chance is astronomically low
 * with 900 million possible numbers.
 */
async function generateAccountNumber(session) {
  for (let i = 0; i < 5; i++) {
    const rest = String(randomInt(0, 1_000_000_000)).padStart(9, '0');
    const number = `9${rest}`;
    const exists = await Account.exists({ accountNumber: number }).session(session ?? null);
    if (!exists) return number;
  }
  const err = new Error('Could not generate a unique account number');
  err.status = 500;
  throw err;
}

/**
 * Create an Account for a newly registered user.
 * Pass a Mongoose `session` from an outer transaction to keep it atomic
 * with User creation.
 */
export async function createAccountForUser(userId, session) {
  const accountNumber = await generateAccountNumber(session);
  const [account] = await Account.create(
    [{ userId, accountNumber, balance: 0 }],
    session ? { session } : undefined,
  );
  return account;
}

export async function getAccountByUserId(userId) {
  return Account.findOne({ userId });
}

/**
 * Dev-only balance top-up. Never expose this in production.
 */
export async function topUpBalance(userId, koboAmount) {
  if (!Number.isInteger(koboAmount) || koboAmount <= 0) {
    const err = new Error('Amount must be a positive integer (kobo)');
    err.status = 400;
    throw err;
  }
  const account = await Account.findOneAndUpdate(
    { userId },
    { $inc: { balance: koboAmount } },
    { new: true },
  );
  if (!account) {
    const err = new Error('Account not found');
    err.status = 404;
    throw err;
  }
  return account;
}
