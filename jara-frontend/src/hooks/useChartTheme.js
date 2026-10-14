import { useEffect, useState } from 'react';
import { useTheme } from './useTheme';

/**
 * useChartTheme — resolves CSS token values to concrete colours so
 * recharts (which doesn't understand `var(--…)`) can style strokes,
 * grid lines, tooltips and series colours.
 *
 * Re-runs when the resolved theme mode flips so dark/light swaps are live.
 * Returns:
 *   { text, textMuted, border, bgElev, primary, primaryLight, primaryDark,
 *     success, danger, warning, info, series: [p1,p2,p3,p4,p5] }
 */
const TOKENS = {
  text:         '--color-text',
  textMuted:    '--color-text-muted',
  border:       '--color-border',
  bgElev:       '--color-bg-elev',
  primary:      '--color-primary',
  primaryLight: '--color-primary-light',
  primaryDark:  '--color-primary-dark',
  success:      '--color-success',
  danger:       '--color-danger',
  warning:      '--color-warning',
  info:         '--color-info',
};

export function useChartTheme() {
  const { mode } = useTheme();
  const [palette, setPalette] = useState(() => resolve());

  useEffect(() => {
    // mode is a signal — re-resolve from CSS vars after the DOM has had
    // a tick to apply the new data-theme attribute.
    const id = requestAnimationFrame(() => setPalette(resolve()));
    return () => cancelAnimationFrame(id);
  }, [mode]);

  return palette;
}

function resolve() {
  if (typeof document === 'undefined') return {};
  const cs = getComputedStyle(document.documentElement);
  const read = (name) => cs.getPropertyValue(name).trim();

  const base = {};
  for (const [k, v] of Object.entries(TOKENS)) base[k] = read(v) || undefined;

  // Fixed 5-series palette anchored on the plum family + accents so the
  // same chart stays readable in both themes.
  base.series = [
    base.primary,
    '#3B82F6',    // info-like blue
    '#10B981',    // success green
    '#F59E0B',    // warning amber
    '#EC4899',    // pink
  ];
  return base;
}
