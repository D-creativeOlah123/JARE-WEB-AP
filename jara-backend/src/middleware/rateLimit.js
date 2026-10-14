import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Auth endpoints are the biggest brute-force targets, so they get tighter
 * caps than the rest of the API. All limiters are keyed on the client IP —
 * plus, for login/reset, also on the submitted identifier so an attacker
 * can't burn one victim's budget from many IPs.
 *
 * Test/dev mode: raised limits so seed/dev-repeat flows don't lock you out.
 */
const scale = env.isProd ? 1 : 6;

function make({ windowMs, max, message, keyGenerator }) {
  return rateLimit({
    windowMs,
    max: Math.floor(max * scale),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        error: {
          message,
          code: 'rate_limited',
          retryAfter: res.getHeader('Retry-After'),
        },
      });
    },
    skip: () => env.isTest,
  });
}

/** 20 requests / 15 min per IP+identifier. Login. */
export const loginLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts — try again in a few minutes.',
  keyGenerator: (req, res) => {
    const id = String(req.body?.identifier || '').toLowerCase().trim();
    return `${ipKeyGenerator(req.ip, res)}:${id}`;
  },
});

/** 10 OTP requests / 15 min per IP. */
export const otpLimiter = make({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many code requests — wait a bit before requesting another.',
});

/** 5 password-reset requests / hour per IP. */
export const resetLimiter = make({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many reset attempts — try again later.',
});

/** 5 signups / hour per IP. */
export const signupLimiter = make({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many signups from this address — try again later.',
});
