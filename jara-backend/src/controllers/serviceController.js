import { NETWORKS } from '../data/networks.js';
import { DATA_PLANS, listPlansByNetwork } from '../data/dataPlans.js';
import {
  DISCOS, METER_TYPES,
  CABLE_PROVIDERS, CABLE_PACKAGES,
  EDU_PROVIDERS, EDU_PRODUCTS,
} from '../data/billProviders.js';
import {
  buyAirtime,
  buyData,
  buyElectricity,
  buyCable,
  buyEducation,
  verifyElectricityMeter,
  verifyCableSmartcard,
  listServiceHistory,
} from '../services/serviceTxService.js';

export function networks(req, res) {
  res.json({ networks: NETWORKS });
}

export function dataPlans(req, res, next) {
  try {
    const { network } = req.query;
    const plans = network ? listPlansByNetwork(String(network).toLowerCase()) : DATA_PLANS;
    res.json({ plans });
  } catch (err) { next(err); }
}

export async function airtime(req, res, next) {
  try {
    const { network, phone, amountNaira, pin } = req.body;
    if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
      const err = new Error('amountNaira must be a positive number');
      err.status = 400; throw err;
    }
    const tx = await buyAirtime({
      userId: req.user.id,
      network,
      phone,
      amountKobo: Math.round(amountNaira * 100),
      pin,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
}

export async function data(req, res, next) {
  try {
    const { network, phone, planId, pin } = req.body;
    const tx = await buyData({
      userId: req.user.id,
      network,
      phone,
      planId,
      pin,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
}

// ------------- Bill catalogue -----------------------------------------------
export function bills(req, res) {
  res.json({
    electricity: { discos: DISCOS, meterTypes: METER_TYPES },
    cable:       { providers: CABLE_PROVIDERS, packages: CABLE_PACKAGES },
    education:   { providers: EDU_PROVIDERS, products: EDU_PRODUCTS },
  });
}

// ------------- Verifications ------------------------------------------------
export async function verifyMeter(req, res, next) {
  try {
    const { discoId, meterNumber, meterType } = req.body;
    const result = await verifyElectricityMeter({ discoId, meterNumber, meterType });
    res.json({ verified: true, ...result });
  } catch (err) { next(err); }
}

export async function verifySmartcard(req, res, next) {
  try {
    const { providerId, smartcard } = req.body;
    const result = await verifyCableSmartcard({ providerId, smartcard });
    res.json({ verified: true, ...result });
  } catch (err) { next(err); }
}

// ------------- Purchases ----------------------------------------------------
export async function electricity(req, res, next) {
  try {
    const { discoId, meterNumber, meterType, amountNaira, phone, pin } = req.body;
    const tx = await buyElectricity({
      userId: req.user.id,
      discoId, meterNumber, meterType,
      amountKobo: Math.round(Number(amountNaira) * 100),
      phone, pin,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
}

export async function cable(req, res, next) {
  try {
    const { providerId, packageId, smartcard, phone, pin } = req.body;
    const tx = await buyCable({
      userId: req.user.id,
      providerId, packageId, smartcard, phone, pin,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
}

export async function education(req, res, next) {
  try {
    const { providerId, productId, phone, pin } = req.body;
    const tx = await buyEducation({
      userId: req.user.id,
      providerId, productId, phone, pin,
    });
    res.status(201).json({ transaction: tx });
  } catch (err) { next(err); }
}

export async function history(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const items = await listServiceHistory({ userId: req.user.id, limit });
    res.json({ transactions: items });
  } catch (err) { next(err); }
}
