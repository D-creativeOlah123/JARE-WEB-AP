/**
 * Nigerian naira formatter. Uses Intl for correct grouping. We prepend the
 * ₦ symbol manually because Intl currency codes like "NGN" print "NGN"
 * text, not the ₦ glyph — which is what the design uses.
 */
export function formatNaira(amount, { showSign = false, decimals = 0 } = {}) {
  const n = Number(amount ?? 0);
  const sign = showSign && n > 0 ? '+' : '';
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(n));
  return `${sign}${n < 0 ? '-' : ''}₦${formatted}`;
}

export function formatPercent(pct, { showSign = true, decimals = 1 } = {}) {
  const n = Number(pct ?? 0);
  const sign = showSign && n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}
