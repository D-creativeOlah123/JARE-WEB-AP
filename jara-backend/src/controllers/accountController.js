import { env } from '../config/env.js';
import { getAccountByUserId, topUpBalance } from '../services/accountService.js';

/**
 * GET /api/accounts/me — the caller's account (number + balance).
 * Balance is returned in kobo AND naira for frontend convenience.
 */
export async function myAccount(req, res, next) {
  try {
    const acct = await getAccountByUserId(req.user.id);
    if (!acct) {
      const err = new Error('Account not found');
      err.status = 404;
      throw err;
    }
    res.json({
      account: {
        accountNumber: acct.accountNumber,
        currency: acct.currency,
        balance: acct.balance,               // kobo (integer)
        balanceNaira: acct.balance / 100,    // convenience — do not use for math
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/accounts/dev-seed — DEV ONLY.
 * Body: { amountNaira: number } — tops up the caller's balance so we can
 * test transfers without a real payment provider.
 */
export async function devSeed(req, res, next) {
  try {
    if (env.isProd) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    const { amountNaira } = req.body;
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400;
      throw err;
    }
    const kobo = Math.round(amountNaira * 100);
    const acct = await topUpBalance(req.user.id, kobo);
    res.json({ account: { accountNumber: acct.accountNumber, balance: acct.balance } });
  } catch (err) {
    next(err);
  }
}
