import { randomBytes, randomInt } from 'node:crypto';
import { Card } from '../models/Card.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { isConfigured as paystackConfigured } from './paystackClient.js';

const BASE = 'https://api.paystack.co';

async function paystackCall(path, { method = 'GET', body } = {}) {
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
    throw err;
  }
  return json.data;
}

/**
 * Kick off a card-add. Real Paystack: initialize a ₦50 transaction with a
 * unique reference; the frontend redirects to the returned authorization_url,
 * the user enters card details, Paystack tokenises it, and their webhook /
 * verify call returns the authorization_code that we then persist.
 *
 * Stub mode (no PAYSTACK_SECRET_KEY): fabricates a plausible card and stores
 * it immediately, no user interaction.
 */
export async function initiateAddCard({ userId }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const reference = `CARD_${Date.now()}_${randomBytes(4).toString('hex').toUpperCase()}`;

  if (!paystackConfigured) {
    // Stub: instantly create a fake card.
    const brands = ['Visa', 'Mastercard', 'Verve'];
    const brand = brands[randomInt(0, brands.length)];
    const last4 = String(randomInt(1000, 10000));
    const now = new Date();
    const doc = await Card.create({
      userId,
      authCode: `STUB_AUTH_${randomBytes(6).toString('hex').toUpperCase()}`,
      brand,
      last4,
      expMonth: String((now.getMonth() + 1)).padStart(2, '0'),
      expYear:  String(now.getFullYear() + 3).slice(-2),
      bank: 'Test Bank Ltd',
      isDefault: false,
      mode: 'stub',
    });
    // First card auto-default.
    const count = await Card.countDocuments({ userId });
    if (count === 1) {
      doc.isDefault = true;
      await doc.save();
    }
    return { mode: 'stub', card: doc.toObject(), reference };
  }

  // Live: initialise a small charge; frontend redirects the user to
  // authorization_url. We rely on `/api/cards/verify/:reference` (after the
  // user is bounced back) to persist the tokenised card.
  const init = await paystackCall('/transaction/initialize', {
    method: 'POST',
    body: {
      email: user.email,
      amount: 5000,             // ₦50 in kobo — refunded/void in prod; here it's just a tokenise probe
      reference,
      channels: ['card'],
      callback_url: env.corsOrigins?.[0]
        ? `${env.corsOrigins[0]}/profile/cards?ref=${reference}`
        : undefined,
      metadata: { userId: String(userId), purpose: 'add_card' },
    },
  });

  return {
    mode: 'live',
    reference: init.reference,
    authorizationUrl: init.authorization_url,
    accessCode: init.access_code,
  };
}

/**
 * Verify a Paystack reference and persist the resulting authorization.
 * Called after the redirect returns to `/profile/cards?ref=...`.
 */
export async function verifyAddCard({ userId, reference }) {
  if (!paystackConfigured) {
    // In stub mode there's nothing to verify — the card was created inline.
    const err = new Error('Verify is only used in live mode');
    err.status = 400;
    throw err;
  }

  const data = await paystackCall(`/transaction/verify/${encodeURIComponent(reference)}`);
  const auth = data?.authorization;
  if (data.status !== 'success' || !auth?.authorization_code) {
    const err = new Error('Card authorisation failed');
    err.status = 400;
    throw err;
  }
  if (!auth.reusable) {
    const err = new Error('Card cannot be saved for reuse');
    err.status = 400;
    throw err;
  }

  const existing = await Card.findOne({ userId, authCode: auth.authorization_code });
  if (existing) return existing.toObject();

  const doc = await Card.create({
    userId,
    authCode: auth.authorization_code,
    brand: auth.brand || 'Card',
    last4: auth.last4,
    expMonth: auth.exp_month,
    expYear:  auth.exp_year,
    bank: auth.bank,
    channel: auth.channel,
    reusable: auth.reusable,
    countryCode: auth.country_code,
    mode: 'live',
  });
  const count = await Card.countDocuments({ userId });
  if (count === 1) {
    doc.isDefault = true;
    await doc.save();
  }
  return doc.toObject();
}

export async function listCards(userId) {
  return Card.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
}

export async function removeCard({ userId, cardId }) {
  const doc = await Card.findOneAndDelete({ _id: cardId, userId });
  if (!doc) {
    const err = new Error('Card not found');
    err.status = 404;
    throw err;
  }
  // If we removed the default, promote the newest surviving card.
  if (doc.isDefault) {
    const next = await Card.findOne({ userId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
  return { removed: true };
}

export async function setDefault({ userId, cardId }) {
  const target = await Card.findOne({ _id: cardId, userId });
  if (!target) {
    const err = new Error('Card not found');
    err.status = 404;
    throw err;
  }
  await Card.updateMany({ userId }, { $set: { isDefault: false } });
  target.isDefault = true;
  await target.save();
  return target.toObject();
}
