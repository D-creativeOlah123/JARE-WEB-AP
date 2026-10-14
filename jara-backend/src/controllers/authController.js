import { env } from '../config/env.js';
import { User } from '../models/User.js';
import {
  registerUser,
  authenticateUser,
  issueTokens,
  setTransferPin as setTransferPinService,
  changePassword as changePasswordService,
  changeTransferPin as changeTransferPinService,
  updateProfile as updateProfileService,
} from '../services/authService.js';
import { issueOtp, verifyOtp as verifyOtpService } from '../services/otpService.js';
import { hashPassword } from '../utils/hash.js';
import { verifyRefreshToken } from '../utils/jwt.js';

const REFRESH_COOKIE = 'jara_refresh';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/auth',   // cookie only sent to auth endpoints
  });
}

/**
 * POST /api/auth/register
 * Body: { fullName, email, phone, password }
 * Returns: { user, accessToken } and sets refresh cookie.
 */
export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body);
    const { accessToken, refreshToken } = issueTokens(user);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/dev-promote — DEV ONLY.
 * Promotes the current caller to `admin`. Guarded by env.isProd.
 * Returns the updated user; the caller must re-login (or refresh) so the
 * new role is stamped into their JWT.
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    await changePasswordService({ userId: req.user.id, currentPassword, newPassword });
    res.json({ changed: true });
  } catch (err) { next(err); }
}

export async function changeTransferPin(req, res, next) {
  try {
    const { currentPin, newPin } = req.body;
    await changeTransferPinService({ userId: req.user.id, currentPin, newPin });
    res.json({ changed: true });
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await updateProfileService({ userId: req.user.id, patch: req.body });
    res.json({ user });
  } catch (err) { next(err); }
}

export async function devPromote(req, res, next) {
  try {
    if (env.isProd) {
      const err = new Error('Not found');
      err.status = 404;
      throw err;
    }
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { role: 'admin' } },
      { new: true },
    );
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ user, note: 'Re-login or /auth/refresh to receive a token with the new role.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { identifier, password }   // identifier = email OR phone
 */
export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const user = await authenticateUser({ identifier, password });
    const { accessToken, refreshToken } = issueTokens(user);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/transfer-pin
 * Requires auth. Body: { pin }
 */
export async function setTransferPin(req, res, next) {
  try {
    await setTransferPinService(req.user.id, req.body.pin);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Reads the httpOnly refresh cookie set at login, verifies it, and issues
 * a brand-new access + refresh token (rotation). Called by the frontend on
 * app boot and after a 401.
 */
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    // No cookie at all = not signed in. Not an error — return 200 with
    // user: null so the frontend boot check doesn't log a 401 in the console.
    if (!token) {
      return res.json({ user: null, accessToken: null });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      // Cookie present but tampered/expired — that's a real 401.
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      const err = new Error('Invalid or expired refresh token');
      err.status = 401;
      throw err;
    }

    const user = await User.findById(payload.sub).select('+transferPinHash');
    if (!user) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      const err = new Error('User not found');
      err.status = 401;
      throw err;
    }

    const { accessToken, refreshToken } = issueTokens(user);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Clears the refresh cookie. Frontend must also drop its in-memory access
 * token to complete sign-out.
 */
export function logout(req, res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
}

/**
 * GET /api/auth/me
 * Requires: Authorization: Bearer <accessToken>
 */
export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('+transferPinHash');
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// OTP endpoints
// ---------------------------------------------------------------------------

/**
 * Resolve `contact` from an authenticated user OR from the identifier the
 * client sent. Email channel → email address; SMS channel → phone number.
 */
async function resolveContact({ channel, identifier, userIdFromAuth }) {
  if (userIdFromAuth) {
    const u = await User.findById(userIdFromAuth);
    if (!u) return null;
    return { contact: channel === 'email' ? u.email : u.phone, userId: u._id };
  }
  if (!identifier) return null;
  const q = identifier.includes('@')
    ? { email: identifier.toLowerCase().trim() }
    : { phone: identifier.trim() };
  const u = await User.findOne(q);
  if (!u) return null;
  return { contact: channel === 'email' ? u.email : u.phone, userId: u._id };
}

/**
 * POST /api/auth/send-otp
 * Body: { channel: 'sms'|'email', purpose: 'signup'|'reset', identifier? }
 * If the caller is authenticated, we use their own email/phone for the
 * contact and identifier is ignored.
 */
export async function sendOtp(req, res, next) {
  try {
    const { channel, purpose, identifier } = req.body;
    const resolved = await resolveContact({
      channel,
      identifier,
      userIdFromAuth: req.user?.id,
    });
    if (!resolved) {
      const err = new Error('No matching account for that identifier');
      err.status = 404;
      throw err;
    }
    const result = await issueOtp({
      contact: resolved.contact,
      channel,
      purpose,
      userId: resolved.userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/verify-otp
 * Body: { channel, purpose, identifier, code }
 */
export async function verifyOtp(req, res, next) {
  try {
    const { channel, purpose, identifier, code } = req.body;
    const resolved = await resolveContact({
      channel,
      identifier,
      userIdFromAuth: req.user?.id,
    });
    if (!resolved) {
      const err = new Error('Invalid or expired code');
      err.status = 400;
      throw err;
    }

    await verifyOtpService({
      contact: resolved.contact,
      purpose,
      code,
    });

    // For signup verification, mark the flag on the user.
    if (purpose === 'signup') {
      const patch = channel === 'email'
        ? { emailVerified: true }
        : { phoneVerified: true };
      await User.updateOne({ _id: resolved.userId }, { $set: patch });
    }

    res.json({ verified: true, purpose, channel });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 * Body: { identifier, channel }
 * Always returns the same generic success so we don't leak which accounts
 * exist. Only actually issues a code when the account is real.
 */
export async function forgotPassword(req, res, next) {
  try {
    const { identifier, channel } = req.body;
    const generic = {
      message: 'If the account exists, a code has been sent.',
    };

    const resolved = await resolveContact({
      channel,
      identifier,
      userIdFromAuth: null,
    });
    if (!resolved) return res.json(generic);

    try {
      const result = await issueOtp({
        contact: resolved.contact,
        channel,
        purpose: 'reset',
        userId: resolved.userId,
      });
      // Return generic message + (in dev) the devOtp so the flow is testable.
      return res.json(
        env.isProd ? generic : { ...generic, dev: result },
      );
    } catch {
      // Any issue (rate-limited etc.) still returns generic success.
      return res.json(generic);
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Body: { identifier, channel, code, newPassword }
 */
export async function resetPassword(req, res, next) {
  try {
    const { identifier, channel, code, newPassword } = req.body;
    const resolved = await resolveContact({
      channel,
      identifier,
      userIdFromAuth: null,
    });
    if (!resolved) {
      const err = new Error('Invalid or expired code');
      err.status = 400;
      throw err;
    }

    await verifyOtpService({
      contact: resolved.contact,
      purpose: 'reset',
      code,
    });

    const passwordHash = await hashPassword(newPassword);
    await User.updateOne(
      { _id: resolved.userId },
      { $set: { passwordHash } },
    );

    res.json({ reset: true });
  } catch (err) {
    next(err);
  }
}
