import {
  quoteJaraTransfer,
  executeJaraTransfer,
  listTransfers,
  verifyBankAccount,
  executeBankTransfer,
} from '../services/transferService.js';

/**
 * POST /api/transfers/quote — validate a proposed transfer and return
 * the recipient's name, so the frontend can show "Recipient: MERCY K."
 * before the user commits.
 * Body: { toAccountNumber }
 */
export async function quote(req, res, next) {
  try {
    const { toAccountNumber } = req.body;
    const recipient = await quoteJaraTransfer({
      toAccountNumber,
      fromUserId: req.user.id,
    });
    res.json({ recipient });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transfers — execute a Jara-to-Jara transfer.
 * Body: { toAccountNumber, amountNaira, remark, pin }
 */
export async function execute(req, res, next) {
  try {
    const { toAccountNumber, amountNaira, remark, pin } = req.body;

    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400;
      throw err;
    }
    const amountKobo = Math.round(amountNaira * 100);

    const transfer = await executeJaraTransfer({
      fromUserId: req.user.id,
      toAccountNumber,
      amountKobo,
      remark,
      pin,
    });

    res.status(201).json({ transfer });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transfers/bank/verify
 * Body: { bankCode, accountNumber }
 */
export async function verifyBank(req, res, next) {
  try {
    const { bankCode, accountNumber } = req.body;
    const recipient = await verifyBankAccount({ bankCode, accountNumber });
    res.json({ recipient });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/transfers/bank
 * Body: { bankCode, accountNumber, accountName, amountNaira, remark, pin }
 */
export async function executeBank(req, res, next) {
  try {
    const { bankCode, accountNumber, accountName, amountNaira, remark, pin } = req.body;
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400;
      throw err;
    }
    const transfer = await executeBankTransfer({
      fromUserId: req.user.id,
      bankCode,
      accountNumber,
      accountName,
      amountKobo: Math.round(amountNaira * 100),
      remark,
      pin,
    });
    res.status(201).json({ transfer });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/transfers — the caller's recent transfers.
 */
export async function list(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const transfers = await listTransfers({ userId: req.user.id, limit });
    res.json({ transfers });
  } catch (err) {
    next(err);
  }
}
