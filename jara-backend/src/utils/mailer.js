import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

/**
 * SMTP transport, created once at module load. If SMTP_USER / SMTP_PASS
 * are missing the transport is null and sendMail() falls back to logging
 * — so dev works without any email setup.
 */
export const isConfigured = Boolean(env.mail.user && env.mail.pass);

const transport = isConfigured
  ? nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: { user: env.mail.user, pass: env.mail.pass },
      // Fail fast on flaky/blocked networks so background sends surface
      // in logs quickly instead of hanging for minutes.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
    })
  : null;

export async function sendMail({ to, subject, text, html }) {
  if (!transport) {
    console.log('[mail:dev-fallback]', { to, subject, text });
    return { delivered: false, mode: 'dev-fallback' };
  }

  const info = await transport.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, mode: 'smtp', messageId: info.messageId };
}

export function renderOtpEmail(code, purpose) {
  const purposeText =
    purpose === 'reset' ? 'reset your password' :
    purpose === 'signup' ? 'verify your account' :
    'confirm this action';

  return {
    subject: `Your Jara verification code: ${code}`,
    text: `Your Jara code to ${purposeText} is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:Inter,system-ui,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
        <h1 style="color:#A63A8F;font-size:20px;">Jara verification code</h1>
        <p>Use the code below to ${purposeText}:</p>
        <div style="font-size:32px;letter-spacing:6px;font-weight:700;background:#F7E7F2;padding:16px;border-radius:12px;text-align:center;color:#7B2C6A;">
          ${code}
        </div>
        <p style="color:#6B5B7A;font-size:13px;margin-top:16px;">
          The code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}
