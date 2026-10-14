import { api } from './api';

/**
 * Ask the backend to confirm a recipient before we commit. Returns
 * { accountNumber, accountName } or throws on 404 / 400.
 */
export async function quoteJaraTransfer({ toAccountNumber }) {
  const { data } = await api.post('/transfers/quote', { toAccountNumber });
  return data.recipient;
}

/**
 * Fire the actual transfer. Requires a valid 4-digit transfer PIN.
 * Returns the persisted Transfer document (with reference, status, etc.).
 */
export async function executeJaraTransfer({ toAccountNumber, amountNaira, remark, pin }) {
  const { data } = await api.post('/transfers', {
    toAccountNumber,
    amountNaira,
    remark,
    pin,
  });
  return data.transfer;
}

export async function listTransfers({ limit } = {}) {
  const { data } = await api.get('/transfers', { params: { limit } });
  return data.transfers;
}
