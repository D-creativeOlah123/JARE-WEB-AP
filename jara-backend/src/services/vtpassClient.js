import { randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

export const isConfigured = Boolean(env.vtpass?.apiKey && env.vtpass?.secretKey);

/**
 * Map our internal network id → VTPass' serviceID for airtime endpoints.
 * VTPass names each network's airtime service e.g. "mtn", "airtel", "glo",
 * "etisalat" (their name for 9mobile). Kept isolated so the frontend never
 * has to know provider-specific slugs.
 */
const VT_AIRTIME_SERVICE_ID = {
  mtn: 'mtn', airtel: 'airtel', glo: 'glo', '9mobile': 'etisalat',
};

const VT_DATA_SERVICE_ID = {
  mtn: 'mtn-data', airtel: 'airtel-data', glo: 'glo-data', '9mobile': 'etisalat-data',
};

async function call(path, body) {
  const res = await fetch(`${env.vtpass.baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'api-key': env.vtpass.apiKey,
      'secret-key': env.vtpass.secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  // VTPass returns { code, content, response_description, ... }. Success is
  // "000" (code) or content.transactions.status === "delivered".
  const okCode = String(json?.code || '').startsWith('000');
  if (!res.ok || !okCode) {
    const err = new Error(json?.response_description || `VTPass ${path} failed`);
    err.status = res.status >= 400 && res.status < 500 ? 400 : 502;
    err.vtpass = json;
    throw err;
  }
  return json;
}

export async function buyAirtime({ network, phone, amountKobo }) {
  if (!isConfigured) {
    return {
      status: 'success',
      reference: `VT_STUB_A_${randomBytes(5).toString('hex').toUpperCase()}`,
      mode: 'stub',
    };
  }
  const requestId = `Jara_${Date.now()}_${randomBytes(3).toString('hex')}`;
  const data = await call('/pay', {
    request_id: requestId,
    serviceID: VT_AIRTIME_SERVICE_ID[network] || network,
    amount: amountKobo / 100,
    phone,
  });
  return {
    status: 'success',
    reference: data?.content?.transactions?.transactionId || requestId,
    mode: 'live',
  };
}

/**
 * Verify a customer identifier against a provider (meter number, smart-card,
 * profile ID). Real VTPass endpoint is /merchant-verify.
 * Stub returns a plausible-looking name derived from the identifier.
 */
export async function verifyCustomer({ serviceID, billersCode, type }) {
  if (!isConfigured) {
    return {
      customerName: `TEST CUSTOMER ${String(billersCode || '').slice(-4)}`,
      address: '1 Marina, Lagos',
      mode: 'stub',
    };
  }
  const res = await fetch(`${env.vtpass.baseUrl}/merchant-verify`, {
    method: 'POST',
    headers: {
      'api-key': env.vtpass.apiKey,
      'secret-key': env.vtpass.secretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ serviceID, billersCode, type }),
  });
  const json = await res.json();
  const okCode = String(json?.code || '').startsWith('000');
  if (!res.ok || !okCode) {
    const err = new Error(json?.response_description || 'Verification failed');
    err.status = 400; err.vtpass = json; throw err;
  }
  return {
    customerName: json?.content?.Customer_Name || json?.content?.customerName || 'CUSTOMER',
    address:      json?.content?.Address || null,
    accountType:  json?.content?.Meter_Type || json?.content?.Account_Type || null,
    dueAmount:    json?.content?.Due_Amount ?? null,
    mode: 'live',
  };
}

/**
 * Pay for a bill (electricity/cable/education). Amount is variable for
 * electricity and fixed for cable/education (comes from our local catalogue).
 */
export async function buyBill({
  serviceID, billersCode, variationCode, amountKobo, phone,
}) {
  if (!isConfigured) {
    return {
      status: 'success',
      reference: `VT_STUB_B_${randomBytes(5).toString('hex').toUpperCase()}`,
      token: `${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`,
      mode: 'stub',
    };
  }
  const requestId = `Jara_${Date.now()}_${randomBytes(3).toString('hex')}`;
  const body = {
    request_id: requestId,
    serviceID,
    billersCode,
    amount: amountKobo / 100,
    phone,
  };
  if (variationCode) body.variation_code = variationCode;

  const data = await call('/pay', body);
  return {
    status: 'success',
    reference: data?.content?.transactions?.transactionId || requestId,
    token: data?.purchased_code || data?.content?.transactions?.token || null,
    mode: 'live',
  };
}

export async function buyData({ network, phone, plan, amountKobo }) {
  if (!isConfigured) {
    return {
      status: 'success',
      reference: `VT_STUB_D_${randomBytes(5).toString('hex').toUpperCase()}`,
      mode: 'stub',
    };
  }
  const requestId = `Jara_${Date.now()}_${randomBytes(3).toString('hex')}`;
  const data = await call('/pay', {
    request_id: requestId,
    serviceID: VT_DATA_SERVICE_ID[network] || `${network}-data`,
    billersCode: phone,
    variation_code: plan,
    amount: amountKobo / 100,
    phone,
  });
  return {
    status: 'success',
    reference: data?.content?.transactions?.transactionId || requestId,
    mode: 'live',
  };
}
