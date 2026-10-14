import { api } from './api';

/** Returns { accountNumber, currency, balance (kobo), balanceNaira }. */
export async function getMyAccount() {
  const { data } = await api.get('/accounts/me');
  return data.account;
}

/** DEV-ONLY: tops up the caller's account by `amountNaira`. */
export async function devSeedBalance(amountNaira) {
  const { data } = await api.post('/accounts/dev-seed', { amountNaira });
  return data.account;
}
