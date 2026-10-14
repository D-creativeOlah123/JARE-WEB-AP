import { api } from './api';

export async function listBanks() {
  const { data } = await api.get('/banks');
  return data.banks;
}

export async function verifyBankAccount({ bankCode, accountNumber }) {
  const { data } = await api.post('/transfers/bank/verify', { bankCode, accountNumber });
  return data.recipient;
}

export async function executeBankTransfer({ bankCode, accountNumber, accountName, amountNaira, remark, pin }) {
  const { data } = await api.post('/transfers/bank', {
    bankCode, accountNumber, accountName, amountNaira, remark, pin,
  });
  return data.transfer;
}
