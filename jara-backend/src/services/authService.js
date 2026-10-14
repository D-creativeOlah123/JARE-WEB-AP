import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { createAccountForUser } from './accountService.js';

/**
 * Create a new user account. Throws:
 *  - 409 if email or phone already registered
 * Returns the created user (safe JSON, no passwordHash).
 */
export async function registerUser({ fullName, email, phone, password, bvn }) {
  const normalisedEmail = email.toLowerCase().trim();

  const or = [{ email: normalisedEmail }, { phone }];
  if (bvn) or.push({ bvn });

  const existing = await User.findOne({ $or: or }).select('+bvn').lean();
  if (existing) {
    let msg = 'Account already exists';
    if (existing.email === normalisedEmail) msg = 'Email already registered';
    else if (existing.phone === phone) msg = 'Phone already registered';
    else if (existing.bvn === bvn) msg = 'BVN already registered';
    const err = new Error(msg);
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);

  // Wrap User + Account creation in a transaction: if account creation
  // fails, the user document rolls back too — no orphaned users.
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [user] = await User.create(
      [{
        fullName,
        email: normalisedEmail,
        phone,
        passwordHash,
        ...(bvn ? { bvn } : {}),
      }],
      { session },
    );
    await createAccountForUser(user._id, session);
    await session.commitTransaction();
    return user;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Update a user's own profile fields. Only mutable-by-user fields are
 * accepted here: fullName, phone, dob, address, avatar. Email and role
 * are not editable through this path.
 */
export async function updateProfile({ userId, patch }) {
  const allowed = {};
  if (typeof patch.fullName === 'string') {
    const trimmed = patch.fullName.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      const err = new Error('Full name must be 2–80 characters');
      err.status = 400; throw err;
    }
    allowed.fullName = trimmed;
  }
  if (typeof patch.phone === 'string' && patch.phone.trim()) {
    if (!/^\+234\d{10}$/.test(patch.phone.trim())) {
      const err = new Error('Phone must be +234 followed by 10 digits');
      err.status = 400; throw err;
    }
    allowed.phone = patch.phone.trim();
  }
  if (typeof patch.dob === 'string' && patch.dob) {
    const d = new Date(patch.dob);
    if (Number.isNaN(d.getTime())) {
      const err = new Error('Invalid date of birth');
      err.status = 400; throw err;
    }
    allowed.dob = d;
  }
  if (typeof patch.address === 'string') {
    allowed.address = patch.address.trim().slice(0, 200);
  }
  if (typeof patch.avatar === 'string') {
    // Accept a data URI or empty string (empty = clear).
    if (patch.avatar && !/^data:image\/(png|jpe?g|webp);base64,/.test(patch.avatar)) {
      const err = new Error('Avatar must be a data:image/png|jpeg|webp;base64,... URI');
      err.status = 400; throw err;
    }
    if (patch.avatar.length > 700_000) {
      const err = new Error('Avatar too large (max ≈500 KB after base64 encoding)');
      err.status = 413; throw err;
    }
    allowed.avatar = patch.avatar;
  }

  if (Object.keys(allowed).length === 0) {
    const err = new Error('No editable fields provided');
    err.status = 400; throw err;
  }

  try {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: allowed },
      { new: true, runValidators: true },
    );
    if (!updated) {
      const err = new Error('User not found');
      err.status = 404; throw err;
    }
    return updated;
  } catch (err) {
    if (err.code === 11000) {
      const dup = Object.keys(err.keyPattern || {})[0] || 'field';
      const wrapped = new Error(`${dup} already in use`);
      wrapped.status = 409; throw wrapped;
    }
    throw err;
  }
}

/**
 * Set (or replace) a user's 4-digit transfer PIN. Hashed with bcrypt just
 * like the password. Called from an authenticated context.
 */
export async function setTransferPin(userId, pin) {
  if (!/^\d{4}$/.test(String(pin))) {
    const err = new Error('PIN must be exactly 4 digits');
    err.status = 400;
    throw err;
  }
  const transferPinHash = await hashPassword(String(pin));
  await User.updateOne({ _id: userId }, { $set: { transferPinHash } });
}

/**
 * Change the current user's password. Requires the current password so a
 * stolen access token alone can't hijack the account.
 */
export async function changePassword({ userId, currentPassword, newPassword }) {
  if (!newPassword || String(newPassword).length < 8 ||
      !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
    const err = new Error('New password must be 8+ chars with a letter and a number');
    err.status = 400;
    throw err;
  }
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

  const ok = await comparePassword(String(currentPassword || ''), user.passwordHash);
  if (!ok) { const err = new Error('Current password is incorrect'); err.status = 401; throw err; }

  const passwordHash = await hashPassword(String(newPassword));
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
}

/**
 * Change the transfer PIN. Requires the current PIN when the user already
 * has one; if no PIN is set yet, this behaves like setTransferPin.
 */
export async function changeTransferPin({ userId, currentPin, newPin }) {
  if (!/^\d{4}$/.test(String(newPin || ''))) {
    const err = new Error('New PIN must be exactly 4 digits');
    err.status = 400;
    throw err;
  }
  const user = await User.findById(userId).select('+transferPinHash');
  if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }

  if (user.transferPinHash) {
    const ok = await comparePassword(String(currentPin || ''), user.transferPinHash);
    if (!ok) { const err = new Error('Current PIN is incorrect'); err.status = 401; throw err; }
  }
  const transferPinHash = await hashPassword(String(newPin));
  await User.updateOne({ _id: userId }, { $set: { transferPinHash } });
}

/**
 * Verify credentials. `identifier` is either email or phone.
 * Throws 401 on any failure (don't leak whether the account exists).
 */
export async function authenticateUser({ identifier, password }) {
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase().trim() }
    : { phone: identifier.trim() };

  const user = await User.findOne(query).select('+passwordHash +transferPinHash');
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  if (user.suspended) {
    const err = new Error('This account has been suspended. Contact support.');
    err.status = 403;
    throw err;
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  return user;
}

/**
 * Mint access + refresh tokens for a user.
 */
export function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  };
}
