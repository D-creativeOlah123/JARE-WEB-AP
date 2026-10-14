import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Account } from '../models/Account.js';
import { ServiceTransaction } from '../models/ServiceTransaction.js';
import { User } from '../models/User.js';
import { comparePassword } from '../utils/hash.js';
import { findNetwork } from '../data/networks.js';
import { findDataPlan } from '../data/dataPlans.js';
import {
  findDisco,
  findCableProvider, findCablePackage,
  findEduProvider,   findEduProduct,
} from '../data/billProviders.js';
import * as vtpass from './vtpassClient.js';

function generateReference() {
  return `SV${randomBytes(6).toString('hex').toUpperCase()}`;
}

async function verifyPin(userId, pin) {
  if (!/^\d{4}$/.test(String(pin ?? ''))) {
    const err = new Error('4-digit transfer PIN is required'); err.status = 400; throw err;
  }
  const user = await User.findById(userId).select('+transferPinHash');
  if (!user?.transferPinHash) {
    const err = new Error('Transfer PIN not set'); err.status = 400; throw err;
  }
  const ok = await comparePassword(String(pin), user.transferPinHash);
  if (!ok) {
    const err = new Error('Invalid transfer PIN'); err.status = 401; throw err;
  }
}

/**
 * Perform a wallet-debit + ServiceTransaction insert inside a session, then
 * call the provider. On provider failure, refund and mark failed.
 * Shared by both airtime and data purchases.
 */
async function debitAndRecord({ userId, txDoc }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  let tx;
  try {
    const debit = await Account.updateOne(
      { userId, balance: { $gte: txDoc.amount } },
      { $inc: { balance: -txDoc.amount } },
      { session },
    );
    if (debit.matchedCount === 0) {
      const err = new Error('Insufficient balance'); err.status = 400; throw err;
    }
    const [row] = await ServiceTransaction.create(
      [{
        ...txDoc,
        status: vtpass.isConfigured ? 'pending' : 'completed',
        reference: generateReference(),
      }],
      { session },
    );
    await session.commitTransaction();
    tx = row;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
  return tx;
}

async function refundOnFailure({ userId, tx, err }) {
  const s = await mongoose.startSession();
  s.startTransaction();
  try {
    await Account.updateOne(
      { userId },
      { $inc: { balance: tx.amount } },
      { session: s },
    );
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { status: 'failed', failureReason: err.message.slice(0, 200) } },
      { session: s },
    );
    await s.commitTransaction();
  } catch (rollbackErr) {
    await s.abortTransaction();
    console.error('[service-tx] refund FAILED', rollbackErr);
  } finally {
    s.endSession();
  }
}

// ---------------------------------------------------------------------------
// Airtime
// ---------------------------------------------------------------------------
export async function buyAirtime({ userId, network, phone, amountKobo, pin }) {
  if (!Number.isInteger(amountKobo) || amountKobo < 5000) {   // ₦50 minimum
    const err = new Error('Amount must be at least ₦50'); err.status = 400; throw err;
  }
  if (!/^0?[789]\d{9}$/.test(String(phone || '').replace(/\+234/, '0'))) {
    const err = new Error('Enter a valid Nigerian phone number'); err.status = 400; throw err;
  }
  const net = findNetwork(network);
  if (!net) { const err = new Error('Unknown network'); err.status = 400; throw err; }

  await verifyPin(userId, pin);

  const tx = await debitAndRecord({
    userId,
    txDoc: {
      userId,
      type: 'airtime',
      provider: net.id,
      recipient: phone,
      amount: amountKobo,
    },
  });

  try {
    const result = await vtpass.buyAirtime({ network: net.id, phone, amountKobo });
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { providerReference: result.reference, status: 'completed' } },
    );
    return { ...tx.toObject(), providerReference: result.reference, status: 'completed' };
  } catch (err) {
    console.error('[airtime] provider failed', err.message);
    await refundOnFailure({ userId, tx, err });
    const surface = new Error('Airtime purchase failed. Your wallet was refunded.');
    surface.status = 502;
    throw surface;
  }
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
export async function buyData({ userId, network, phone, planId, pin }) {
  const net = findNetwork(network);
  if (!net) { const err = new Error('Unknown network'); err.status = 400; throw err; }
  const plan = findDataPlan(planId);
  if (!plan || plan.network !== net.id) {
    const err = new Error('Unknown data plan for this network'); err.status = 400; throw err;
  }
  if (!/^0?[789]\d{9}$/.test(String(phone || '').replace(/\+234/, '0'))) {
    const err = new Error('Enter a valid Nigerian phone number'); err.status = 400; throw err;
  }
  await verifyPin(userId, pin);

  const tx = await debitAndRecord({
    userId,
    txDoc: {
      userId,
      type: 'data',
      provider: net.id,
      product: plan.id,
      recipient: phone,
      amount: plan.priceKobo,
    },
  });

  try {
    const result = await vtpass.buyData({
      network: net.id,
      phone,
      plan: plan.id,
      amountKobo: plan.priceKobo,
    });
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { providerReference: result.reference, status: 'completed' } },
    );
    return { ...tx.toObject(), providerReference: result.reference, status: 'completed' };
  } catch (err) {
    console.error('[data] provider failed', err.message);
    await refundOnFailure({ userId, tx, err });
    const surface = new Error('Data purchase failed. Your wallet was refunded.');
    surface.status = 502;
    throw surface;
  }
}

// ---------------------------------------------------------------------------
// Bill verifications — meter, smart-card, profile ID. Read-only, no PIN.
// ---------------------------------------------------------------------------
export async function verifyElectricityMeter({ discoId, meterNumber, meterType }) {
  const disco = findDisco(discoId);
  if (!disco) { const err = new Error('Unknown disco'); err.status = 400; throw err; }
  if (!/^\d{6,20}$/.test(String(meterNumber || ''))) {
    const err = new Error('Meter number must be 6–20 digits'); err.status = 400; throw err;
  }
  if (!['prepaid', 'postpaid'].includes(meterType)) {
    const err = new Error('meterType must be prepaid or postpaid'); err.status = 400; throw err;
  }
  return vtpass.verifyCustomer({
    serviceID: disco.id,
    billersCode: meterNumber,
    type: meterType,
  });
}

export async function verifyCableSmartcard({ providerId, smartcard }) {
  const p = findCableProvider(providerId);
  if (!p) { const err = new Error('Unknown TV provider'); err.status = 400; throw err; }
  if (!/^\d{8,14}$/.test(String(smartcard || ''))) {
    const err = new Error('Smart-card number must be 8–14 digits'); err.status = 400; throw err;
  }
  return vtpass.verifyCustomer({ serviceID: p.id, billersCode: smartcard });
}

// ---------------------------------------------------------------------------
// Electricity
// ---------------------------------------------------------------------------
export async function buyElectricity({
  userId, discoId, meterNumber, meterType, amountKobo, phone, pin,
}) {
  const disco = findDisco(discoId);
  if (!disco) { const err = new Error('Unknown disco'); err.status = 400; throw err; }
  if (!Number.isInteger(amountKobo) || amountKobo < 50000) {
    const err = new Error('Amount must be at least ₦500'); err.status = 400; throw err;
  }
  if (!/^\d{6,20}$/.test(String(meterNumber || ''))) {
    const err = new Error('Meter number must be 6–20 digits'); err.status = 400; throw err;
  }
  if (!['prepaid', 'postpaid'].includes(meterType)) {
    const err = new Error('meterType must be prepaid or postpaid'); err.status = 400; throw err;
  }
  await verifyPin(userId, pin);

  const tx = await debitAndRecord({
    userId,
    txDoc: {
      userId,
      type: 'electricity',
      provider: disco.id,
      product: meterType,
      recipient: meterNumber,
      amount: amountKobo,
    },
  });

  try {
    const result = await vtpass.buyBill({
      serviceID: disco.id,
      billersCode: meterNumber,
      variationCode: meterType,
      amountKobo,
      phone: phone || meterNumber,
    });
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { providerReference: result.reference, status: 'completed' } },
    );
    return {
      ...tx.toObject(),
      providerReference: result.reference,
      token: result.token,        // returned to frontend (prepaid units token)
      status: 'completed',
    };
  } catch (err) {
    console.error('[electricity] provider failed', err.message);
    await refundOnFailure({ userId, tx, err });
    const surface = new Error('Electricity payment failed. Your wallet was refunded.');
    surface.status = 502; throw surface;
  }
}

// ---------------------------------------------------------------------------
// Cable / TV — package price is fixed by our catalogue.
// ---------------------------------------------------------------------------
export async function buyCable({ userId, providerId, packageId, smartcard, phone, pin }) {
  const provider = findCableProvider(providerId);
  if (!provider) { const err = new Error('Unknown TV provider'); err.status = 400; throw err; }
  const pkg = findCablePackage(packageId);
  if (!pkg || pkg.providerId !== provider.id) {
    const err = new Error('Unknown package for this provider'); err.status = 400; throw err;
  }
  if (!/^\d{8,14}$/.test(String(smartcard || ''))) {
    const err = new Error('Smart-card number must be 8–14 digits'); err.status = 400; throw err;
  }
  await verifyPin(userId, pin);

  const tx = await debitAndRecord({
    userId,
    txDoc: {
      userId,
      type: 'cable',
      provider: provider.id,
      product: pkg.id,
      recipient: smartcard,
      amount: pkg.priceKobo,
    },
  });

  try {
    const result = await vtpass.buyBill({
      serviceID: provider.id,
      billersCode: smartcard,
      variationCode: pkg.id,
      amountKobo: pkg.priceKobo,
      phone: phone || smartcard,
    });
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { providerReference: result.reference, status: 'completed' } },
    );
    return { ...tx.toObject(), providerReference: result.reference, status: 'completed' };
  } catch (err) {
    console.error('[cable] provider failed', err.message);
    await refundOnFailure({ userId, tx, err });
    const surface = new Error('TV subscription failed. Your wallet was refunded.');
    surface.status = 502; throw surface;
  }
}

// ---------------------------------------------------------------------------
// Education — WAEC/JAMB PINs. Price fixed by product.
// ---------------------------------------------------------------------------
export async function buyEducation({ userId, providerId, productId, phone, pin }) {
  const provider = findEduProvider(providerId);
  if (!provider) { const err = new Error('Unknown education provider'); err.status = 400; throw err; }
  const product = findEduProduct(productId);
  if (!product || product.providerId !== provider.id) {
    const err = new Error('Unknown product for this provider'); err.status = 400; throw err;
  }
  await verifyPin(userId, pin);

  const tx = await debitAndRecord({
    userId,
    txDoc: {
      userId,
      type: 'education',
      provider: provider.id,
      product: product.id,
      recipient: phone || 'self',
      amount: product.priceKobo,
    },
  });

  try {
    const result = await vtpass.buyBill({
      serviceID: provider.id,
      billersCode: phone || String(Date.now()),
      variationCode: product.id,
      amountKobo: product.priceKobo,
      phone: phone || String(Date.now()),
    });
    await ServiceTransaction.updateOne(
      { _id: tx._id },
      { $set: { providerReference: result.reference, status: 'completed' } },
    );
    return {
      ...tx.toObject(),
      providerReference: result.reference,
      token: result.token,      // WAEC/JAMB PIN
      status: 'completed',
    };
  } catch (err) {
    console.error('[education] provider failed', err.message);
    await refundOnFailure({ userId, tx, err });
    const surface = new Error('Education PIN purchase failed. Your wallet was refunded.');
    surface.status = 502; throw surface;
  }
}

export async function listServiceHistory({ userId, limit = 20 }) {
  return ServiceTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .lean();
}
