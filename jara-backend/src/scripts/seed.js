/**
 * Seed development data — admin + a handful of customers, wallets funded,
 * savings goals + a group, a mix of completed / failed transfers and bill
 * payments so admin dashboards have something to render.
 *
 * Usage:
 *   npm run seed              # additive: won't touch existing accounts
 *   npm run seed -- --reset   # DELETE all users + wallets + ledgers first
 *
 * Idempotent for the fixed test emails — running twice does NOT duplicate.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { randomBytes, randomInt } from 'node:crypto';

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { SavingsGoal } from '../models/SavingsGoal.js';
import { Group } from '../models/Group.js';
import { Contribution } from '../models/Contribution.js';
import { Transfer } from '../models/Transfer.js';
import { ServiceTransaction } from '../models/ServiceTransaction.js';
import { Notification } from '../models/Notification.js';
import { Beneficiary } from '../models/Beneficiary.js';
import { Card } from '../models/Card.js';
import { OtpCode } from '../models/OtpCode.js';
import { PlatformSettings } from '../models/PlatformSettings.js';

import { hashPassword } from '../utils/hash.js';
import { createAccountForUser } from '../services/accountService.js';

const RESET = process.argv.includes('--reset');

const DEV_PASSWORD = 'Password123';
const DEV_PIN      = '1234';

const SEEDS = [
  { fullName: 'Ada Admin',       email: 'admin@jara.dev',    phone: '+2348000000001', role: 'admin',    balanceNaira:  50_000 },
  { fullName: 'Chinedu Okoro',   email: 'chinedu@jara.dev',  phone: '+2348000000002', role: 'customer', balanceNaira: 120_000 },
  { fullName: 'Aminat Bello',    email: 'aminat@jara.dev',   phone: '+2348000000003', role: 'customer', balanceNaira:  85_000 },
  { fullName: 'Tunde Adekunle',  email: 'tunde@jara.dev',    phone: '+2348000000004', role: 'customer', balanceNaira:  42_500 },
  { fullName: 'Ngozi Umeh',      email: 'ngozi@jara.dev',    phone: '+2348000000005', role: 'customer', balanceNaira: 200_000 },
  { fullName: 'Yusuf Ibrahim',   email: 'yusuf@jara.dev',    phone: '+2348000000006', role: 'customer', balanceNaira:  15_000 },
];

const GOALS = [
  { name: 'Rent 2026',      category: 'Housing',    targetNaira: 800_000, savedNaira: 240_000 },
  { name: 'Japa Fund',      category: 'Travel',     targetNaira: 2_500_000, savedNaira: 620_000 },
  { name: 'Laptop upgrade', category: 'Electronics',targetNaira:   750_000, savedNaira:  90_000 },
  { name: 'Wedding',        category: 'Family',     targetNaira: 3_500_000, savedNaira: 400_000 },
];

async function resetCollections() {
  console.log('· wiping seedable collections');
  await Promise.all([
    Contribution.deleteMany({}),
    Transfer.deleteMany({}),
    ServiceTransaction.deleteMany({}),
    Notification.deleteMany({}),
    Beneficiary.deleteMany({}),
    Card.deleteMany({}),
    OtpCode.deleteMany({}),
    SavingsGoal.deleteMany({}),
    Group.deleteMany({}),
    Account.deleteMany({}),
    User.deleteMany({}),
    PlatformSettings.deleteMany({}),
  ]);
}

async function upsertUser({ fullName, email, phone, role, balanceNaira }) {
  const existing = await User.findOne({ email });
  if (existing) {
    // Keep it, just make sure the role matches and the wallet exists.
    if (existing.role !== role) {
      existing.role = role;
      await existing.save();
    }
    const acct = await Account.findOne({ userId: existing._id });
    if (!acct) await createAccountForUser(existing._id);
    return existing;
  }

  const passwordHash = await hashPassword(DEV_PASSWORD);
  const transferPinHash = await hashPassword(DEV_PIN);
  const user = await User.create({
    fullName, email, phone, role, passwordHash, transferPinHash,
    emailVerified: true, phoneVerified: true,
  });
  await createAccountForUser(user._id);
  await Account.updateOne(
    { userId: user._id },
    { $set: { balance: Math.round(balanceNaira * 100) } },
  );
  return user;
}

function inMonths(m) {
  const d = new Date();
  d.setMonth(d.getMonth() + m);
  return d;
}

async function seedGoalsFor(userId) {
  const chosen = GOALS.slice(0, randomInt(1, GOALS.length + 1));
  for (const g of chosen) {
    const exists = await SavingsGoal.findOne({ userId, name: g.name });
    if (exists) continue;
    await SavingsGoal.create({
      userId,
      name: g.name,
      category: g.category,
      targetAmount: Math.round(g.targetNaira * 100),
      savedAmount:  Math.round(g.savedNaira * 100),
      endDate: inMonths(6),
      savingFrequency: 'monthly',
      status: g.savedNaira >= g.targetNaira ? 'completed' : 'active',
    });
  }
}

async function seedGroup(creator, members) {
  const name = 'Jara Devs Ajo';
  const existing = await Group.findOne({ name });
  if (existing) return existing;

  const inviteCode = randomBytes(4).toString('hex').toUpperCase().slice(0, 7).padEnd(7, 'X');
  return Group.create({
    creatorId: creator._id,
    name,
    description: 'Monthly rotating pool for the Jara core team.',
    inviteCode,
    targetAmount:           1_500_000_00,
    savedAmount:             400_000_00,
    individualContribution:   50_000_00,
    contributionFrequency: 'monthly',
    groupType: 'pooled',
    targetDate: inMonths(9),
    members: [creator, ...members].map((u, i) => ({
      userId: u._id,
      joinedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      contributedAmount: (i === 0 ? 150_000 : 62_500) * 100,
    })),
  });
}

async function seedTransfersFor(fromUser) {
  const fromAcct = await Account.findOne({ userId: fromUser._id });
  if (!fromAcct) return;

  // Idempotent: skip if this user already has seeded transfers.
  const already = await Transfer.countDocuments({
    fromUserId: fromUser._id,
    remark: { $in: ['Dev seed transfer', 'School fees'] },
  });
  if (already > 0) return;

  const recipients = await User.find({ _id: { $ne: fromUser._id } }).limit(3);
  for (const to of recipients) {
    const toAcct = await Account.findOne({ userId: to._id });
    if (!toAcct) continue;
    const amount = randomInt(200, 5000) * 100;
    await Transfer.create({
      type: 'jara',
      fromUserId:    fromUser._id,
      fromAccountId: fromAcct._id,
      toUserId:      to._id,
      toAccountId:   toAcct._id,
      amount,
      remark: 'Dev seed transfer',
      status: 'completed',
      reference: `SEED_JT_${randomBytes(4).toString('hex').toUpperCase()}`,
    });
  }

  // One failed bank transfer, so the moderation queue has something.
  await Transfer.create({
    type: 'bank',
    fromUserId:    fromUser._id,
    fromAccountId: fromAcct._id,
    toBank: {
      bankCode: '057', bankName: 'Zenith Bank',
      accountNumber: '0123456789', accountName: 'JOHN TEST DOE',
    },
    amount: 250_000,
    remark: 'School fees',
    status: 'failed',
    failureReason: 'Provider timeout during seed',
    reference: `SEED_BT_${randomBytes(4).toString('hex').toUpperCase()}`,
  });
}

async function seedServiceTxFor(user) {
  // Idempotent: skip if this user already has any seeded service transactions.
  const already = await ServiceTransaction.countDocuments({
    userId: user._id,
    reference: { $regex: /^SEED_SV_/ },
  });
  if (already > 0) return;

  const rows = [
    { type: 'airtime',     provider: 'mtn',           product: null,         recipient: '08031234567', amount:   50000, status: 'completed' },
    { type: 'data',        provider: 'airtel',        product: 'airtel-2gb', recipient: '08181234567', amount:  200000, status: 'completed' },
    { type: 'electricity', provider: 'ikeja-electric',product: 'prepaid',    recipient: '45071234567', amount:  500000, status: 'completed' },
    { type: 'cable',       provider: 'dstv',          product: 'dstv79',     recipient: '1023456789',  amount: 1500000, status: 'completed' },
    { type: 'airtime',     provider: 'glo',           product: null,         recipient: '08051234567', amount:  100000, status: 'failed',  failureReason: 'Seed sample failure' },
  ];
  for (const r of rows) {
    await ServiceTransaction.create({
      userId: user._id,
      ...r,
      reference: `SEED_SV_${randomBytes(4).toString('hex').toUpperCase()}`,
    });
  }
}

async function seedNotificationsFor(user) {
  // Idempotent: title acts as the marker for our seed rows.
  const SEED_TITLES = ['Transfer sent', 'Goal milestone', 'Airtime topped up'];
  const already = await Notification.countDocuments({
    userId: user._id,
    title: { $in: SEED_TITLES },
  });
  if (already > 0) return;

  await Notification.create([
    { userId: user._id, type: 'transfer', title: 'Transfer sent',      body: 'Your transfer went through.',        isRead: false },
    { userId: user._id, type: 'goal',     title: 'Goal milestone',     body: 'You crossed 30% of your goal!',      isRead: true  },
    { userId: user._id, type: 'service',  title: 'Airtime topped up',  body: 'MTN airtime purchase completed.',    isRead: false },
  ]);
}

async function main() {
  await connectDB();
  console.log(`— Seeding Jara dev data${RESET ? ' (RESET)' : ''}`);

  if (RESET) await resetCollections();

  // Users + wallets (idempotent).
  const created = {};
  for (const s of SEEDS) {
    const u = await upsertUser(s);
    console.log(`  ✓ ${s.role.padEnd(8)} ${s.email}`);
    created[s.email] = u;
  }

  const admin    = created['admin@jara.dev'];
  const chinedu  = created['chinedu@jara.dev'];
  const aminat   = created['aminat@jara.dev'];
  const tunde    = created['tunde@jara.dev'];
  const ngozi    = created['ngozi@jara.dev'];

  // Goals for each customer.
  for (const u of [chinedu, aminat, tunde, ngozi]) {
    await seedGoalsFor(u._id);
  }
  console.log('  ✓ goals');

  // A shared group.
  await seedGroup(chinedu, [aminat, ngozi, tunde]);
  console.log('  ✓ group');

  // Transfers (customer → 3 others each).
  for (const u of [chinedu, aminat, ngozi]) {
    await seedTransfersFor(u);
  }
  console.log('  ✓ transfers');

  // Bill payments.
  for (const u of [chinedu, aminat, tunde, ngozi]) {
    await seedServiceTxFor(u);
  }
  console.log('  ✓ service transactions');

  // Notifications.
  for (const u of [chinedu, aminat]) {
    await seedNotificationsFor(u);
  }
  console.log('  ✓ notifications');

  // Platform settings singleton.
  await PlatformSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', updatedBy: admin._id } },
    { upsert: true, new: true },
  );
  console.log('  ✓ platform settings');

  console.log('\n— Done. Test accounts:');
  for (const s of SEEDS) {
    console.log(`  ${s.email.padEnd(22)} · password ${DEV_PASSWORD} · pin ${DEV_PIN}${s.role === 'admin' ? '  ← ADMIN' : ''}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
