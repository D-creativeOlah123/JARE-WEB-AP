import { api } from './api';

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}

export async function changeTransferPin({ currentPin, newPin }) {
  const { data } = await api.post('/auth/change-pin', { currentPin, newPin });
  return data;
}

/** Update fullName / phone / dob / address / avatar. Returns the fresh user. */
export async function updateProfile(patch) {
  const { data } = await api.patch('/auth/profile', patch);
  return data.user;
}

/**
 * Auth API helpers — one function per endpoint. Wraps the axios instance
 * so component code reads like: await register({...}) instead of
 * api.post('/auth/register', ...).
 */

export async function register(data) {
  const res = await api.post('/auth/register', data);
  return res.data;          // { user, accessToken }
}

export async function setTransferPin(pin) {
  const res = await api.post('/auth/transfer-pin', { pin });
  return res.data;          // { ok: true }
}

export async function sendOtp({ channel, purpose, identifier }) {
  const res = await api.post('/auth/send-otp', { channel, purpose, identifier });
  return res.data;          // { delivered, mode, expiresAt, devOtp?, devToken? }
}

export async function verifyOtp({ channel, purpose, identifier, code }) {
  const res = await api.post('/auth/verify-otp', {
    channel, purpose, identifier, code,
  });
  return res.data;          // { verified: true, purpose, channel }
}

export async function forgotPassword({ identifier, channel }) {
  const res = await api.post('/auth/forgot-password', { identifier, channel });
  return res.data;
}

export async function resetPassword({ identifier, channel, code, newPassword }) {
  const res = await api.post('/auth/reset-password', {
    identifier, channel, code, newPassword,
  });
  return res.data;
}
