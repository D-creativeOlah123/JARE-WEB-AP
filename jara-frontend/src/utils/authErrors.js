/**
 * friendlyAuthError — turn an axios error from `/api/auth/*` into a line of
 * copy a user can read. Rate limits map to a specific "wait" message;
 * everything else prefers the server's `error.message` if present.
 */
export function friendlyAuthError(err) {
  const status = err?.response?.status;
  const payload = err?.response?.data?.error;
  if (status === 429) return 'Too many attempts — wait a few minutes and try again.';
  if (status === 403 && payload?.message) return payload.message;      // suspended user, etc.
  if (payload?.details?.length) {
    return payload.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
  }
  return payload?.message || err?.message || 'Something went wrong. Please try again.';
}
