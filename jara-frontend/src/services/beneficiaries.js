import { api } from './api';

export async function listBeneficiaries() {
  const { data } = await api.get('/beneficiaries');
  return data.beneficiaries;
}

export async function deleteBeneficiary(id) {
  await api.delete(`/beneficiaries/${id}`);
}
