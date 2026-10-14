import { api } from './api';

export async function listNetworks() {
  const { data } = await api.get('/services/networks');
  return data.networks;
}

export async function listDataPlans(network) {
  const { data } = await api.get('/services/data-plans', { params: { network } });
  return data.plans;
}

export async function buyAirtime({ network, phone, amountNaira, pin }) {
  const { data } = await api.post('/services/airtime', { network, phone, amountNaira, pin });
  return data.transaction;
}

export async function buyData({ network, phone, planId, pin }) {
  const { data } = await api.post('/services/data', { network, phone, planId, pin });
  return data.transaction;
}

export async function listServiceHistory() {
  const { data } = await api.get('/services/history');
  return data.transactions;
}

// --- Bill catalogue -----------------------------------------------------
export async function getBillCatalogue() {
  const { data } = await api.get('/services/bills');
  return data;   // { electricity, cable, education }
}

// --- Verifications ------------------------------------------------------
export async function verifyMeter({ discoId, meterNumber, meterType }) {
  const { data } = await api.post('/services/verify-meter', {
    discoId, meterNumber, meterType,
  });
  return data;   // { verified, customerName, address, ... }
}

export async function verifySmartcard({ providerId, smartcard }) {
  const { data } = await api.post('/services/verify-smartcard', {
    providerId, smartcard,
  });
  return data;
}

// --- Purchases ----------------------------------------------------------
export async function buyElectricity({
  discoId, meterNumber, meterType, amountNaira, phone, pin,
}) {
  const { data } = await api.post('/services/electricity', {
    discoId, meterNumber, meterType, amountNaira, phone, pin,
  });
  return data.transaction;
}

export async function buyCable({ providerId, packageId, smartcard, phone, pin }) {
  const { data } = await api.post('/services/cable', {
    providerId, packageId, smartcard, phone, pin,
  });
  return data.transaction;
}

export async function buyEducation({ providerId, productId, phone, pin }) {
  const { data } = await api.post('/services/education', {
    providerId, productId, phone, pin,
  });
  return data.transaction;
}
