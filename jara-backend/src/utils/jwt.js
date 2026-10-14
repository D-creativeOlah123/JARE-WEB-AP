import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Sign an access token. Short-lived (15m by default). Sent with every
 * authenticated API call as: Authorization: Bearer <token>.
 */
export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

/**
 * Sign a refresh token. Long-lived (7d by default). Stored in an httpOnly
 * cookie so JS on the page cannot read it, then swapped for a new access
 * token when the current one expires.
 */
export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), type: 'refresh' },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}
