/**
 * Transfer limits + fee rules — Phase D defaults.
 *
 * These values mirror the backend `PlatformSettings.limits` defaults so
 * the UI can enforce bounds inline, before the API round-trip. Once a
 * public `GET /api/platform/limits` ships, swap these for a `useLimits()`
 * hook. Both the fee numbers and the "Free Jara-to-Jara / ₦10 to other
 * banks" claim are flagged in CLAIMS_TO_CONFIRM.md.
 */

export const LIMITS = {
  minKobo: 100 * 100,            // ₦100 per transfer
  maxKobo: 1_000_000 * 100,      // ₦1,000,000 per transfer
};

export function feeForTransfer({ type }) {
  // Keep as kobo so the review line can show precision.
  if (type === 'bank') return 10 * 100;      // ₦10 flat — TODO(confirm)
  return 0;                                    // Jara-to-Jara — TODO(confirm)
}

export function validateAmount({ amountKobo, type, walletKobo }) {
  if (!amountKobo || amountKobo < LIMITS.minKobo) {
    return `Minimum per transfer is ₦${(LIMITS.minKobo / 100).toLocaleString('en-NG')}`;
  }
  if (amountKobo > LIMITS.maxKobo) {
    return `Max per transfer is ₦${(LIMITS.maxKobo / 100).toLocaleString('en-NG')}`;
  }
  const fee = feeForTransfer({ type });
  if (walletKobo !== undefined && amountKobo + fee > walletKobo) {
    return 'Amount exceeds your wallet balance (including fee)';
  }
  return '';
}
