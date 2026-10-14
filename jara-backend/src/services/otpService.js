import { env } from '../config/env.js';
import { OtpCode } from '../models/OtpCode.js';
import {
  generateCode,
  hashCode,
  compareCode,
  wrapDevToken,
} from '../utils/otp.js';
import {
  sendMail,
  renderOtpEmail,
  isConfigured as isMailConfigured,
} from '../utils/mailer.js';

/**
 * Issue an OTP for a given contact + purpose + channel.
 *
 * Behavior:
 *  - Rate-limits: rejects if a code was issued within the last resendCooldownSec.
 *  - Invalidates any live un-consumed codes for the same (contact, purpose).
 *  - Delivers: email via nodemailer, sms always dev-mode (until we plug a
 *    real gateway).
 *
 * Returns { delivered, mode, devOtp?, devToken?, expiresAt } — devOtp and
 * devToken are ONLY included when we didn't actually deliver (dev-mode).
 */
export async function issueOtp({ contact, channel, purpose, userId = null }) {
  // 1. Rate-limit — did we issue one for this contact+purpose recently?
  const recent = await OtpCode.findOne({
    contact,
    purpose,
    createdAt: { $gt: new Date(Date.now() - env.otp.resendCooldownSec * 1000) },
  }).sort({ createdAt: -1 });

  if (recent) {
    const err = new Error(
      `Please wait ${env.otp.resendCooldownSec}s before requesting a new code`,
    );
    err.status = 429;
    throw err;
  }

  // 2. Invalidate any live codes for the same contact+purpose.
  await OtpCode.updateMany(
    { contact, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  );

  // 3. Create the new OTP.
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = new Date(Date.now() + env.otp.ttlMinutes * 60 * 1000);

  await OtpCode.create({
    contact, channel, purpose, codeHash, expiresAt, userId,
  });

  // 4. Deliver. Email is fire-and-forget so a slow/blocked SMTP host never
  //    blocks the API response — the OTP is already persisted, delivery can
  //    happen in the background and any failure surfaces in server logs.
  let delivered = false;
  let mode = 'dev-fallback';

  if (channel === 'email') {
    if (isMailConfigured) {
      const { subject, text, html } = renderOtpEmail(code, purpose);
      // Note: no `await` — send happens in the background.
      sendMail({ to: contact, subject, text, html }).catch((err) => {
        console.error('[mail:async-error]', err.message);
      });
      delivered = true;
      mode = 'smtp-async';
    } else {
      console.log('[mail:dev-fallback]', { to: contact, code, purpose });
      delivered = false;
      mode = 'dev-fallback';
    }
  } else {
    // sms: always dev-mode until we add a real gateway.
    console.log('[sms:dev-fallback]', { to: contact, code, purpose });
    delivered = false;
    mode = 'dev-fallback';
  }

  // 5. Build response — include devOtp only when we didn't truly deliver
  //    AND we're not in production.
  const includeDev = !delivered && !env.isProd;

  return {
    delivered,
    mode,
    channel,
    expiresAt,
    ...(includeDev && {
      devOtp: code,
      devToken: wrapDevToken({ code, contact, purpose, expiresAt }),
      hint:
        channel === 'email' && !isMailConfigured
          ? 'SMTP_USER/SMTP_PASS not set — using dev fallback.'
          : 'Dev-mode delivery — plug in a real gateway for production.',
    }),
  };
}

/**
 * Verify an OTP. Consumes it on success. Uses generic errors so we don't
 * leak whether the code was wrong vs expired vs already consumed.
 */
export async function verifyOtp({ contact, purpose, code }) {
  const otp = await OtpCode.findOne({
    contact,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  const genericFail = () => {
    const err = new Error('Invalid or expired code');
    err.status = 400;
    return err;
  };

  if (!otp) throw genericFail();

  if (otp.attempts >= env.otp.maxAttempts) {
    otp.consumedAt = new Date();
    await otp.save();
    throw genericFail();
  }

  const ok = await compareCode(code, otp.codeHash);
  if (!ok) {
    otp.attempts += 1;
    await otp.save();
    throw genericFail();
  }

  otp.consumedAt = new Date();
  await otp.save();

  return { userId: otp.userId, channel: otp.channel };
}
