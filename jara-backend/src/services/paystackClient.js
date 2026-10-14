import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

const BASE = 'https://api.paystack.co';

export const isConfigured = Boolean(env.paystack?.secretKey);

/**
 * Common request helper. Only used when isConfigured.
 * Paystack responses always have `{ status, message, data }`.
 */
async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    const err = new Error(json.message || `Paystack ${path} failed (${res.status})`);
    err.status = res.status >= 400 && res.status < 500 ? 400 : 502;
    err.paystack = json;
    throw err;
  }
  return json.data;
}

/**
 * Resolve a Nigerian bank account number → the holder's name.
 * Prevents "typo transfers" — user sees who they're sending to.
 */
export async function resolveAccount({ accountNumber, bankCode }) {
  if (!isConfigured) {
    return {
      accountName: 'JOHN TEST DOE',   // deterministic-ish mock
      accountNumber: String(accountNumber),
      bankCode: String(bankCode),
      mode: 'stub',
    };
  }
  const data = await call(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  );
  return {
    accountName: data.account_name,
    accountNumber: data.account_number,
    bankCode,
    mode: 'live',
  };
}

/**
 * Initiate a bank transfer.
 * Real Paystack: creates a transfer recipient, then a transfer — 2 API calls.
 * Stub: returns a fake reference. The caller decides what status to persist.
 */
export async function initiateTransfer({
  amountKobo,
  bankCode,
  accountNumber,
  accountName,
  reason,
}) {
  if (!isConfigured) {
    return {
      status: 'success',   // in stub we simulate instant success
      transferCode: `TRF_STUB_${randomBytes(4).toString('hex')}`,
      reference:    `PS_STUB_${randomBytes(6).toString('hex').toUpperCase()}`,
      mode: 'stub',
    };
  }

  // Create transfer recipient
  const recipient = await call('/transferrecipient', {
    method: 'POST',
    body: {
      type: 'nuban',
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    },
  });

  // Initiate transfer (usually returns pending — completion comes via webhook)
  const transfer = await call('/transfer', {
    method: 'POST',
    body: {
      source: 'balance',
      amount: amountKobo,
      recipient: recipient.recipient_code,
      reason: (reason || 'Jara transfer').slice(0, 100),
    },
  });

  return {
    status: transfer.status,             // 'pending' | 'success' | 'failed'
    transferCode: transfer.transfer_code,
    reference:    transfer.reference,
    mode: 'live',
  };
}
