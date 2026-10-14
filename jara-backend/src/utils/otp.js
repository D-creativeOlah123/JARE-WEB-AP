import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SALT_ROUNDS = 8;   // slightly faster than password hashing; OTP is short-lived

/**
 * Generate a zero-padded random numeric code of the configured length.
 * Uses crypto.randomInt (cryptographically secure — never Math.random).
 */
export function generateCode() {
  const max = 10 ** env.otp.length;
  return String(randomInt(0, max)).padStart(env.otp.length, '0');
}

export function hashCode(code) {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export function compareCode(code, hash) {
  return bcrypt.compare(code, hash);
}

/**
 * Wrap the OTP + metadata in a signed JWT. Used only in dev-mode to return
 * a tamper-proof dev token alongside the plaintext OTP, so callers can
 * inspect/consume it programmatically.
 */
export function wrapDevToken({ code, contact, purpose, expiresAt }) {
  return jwt.sign(
    { code, contact, purpose, exp: Math.floor(expiresAt.getTime() / 1000) },
    env.jwt.secret,
  );
}
