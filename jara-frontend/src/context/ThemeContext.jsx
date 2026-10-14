import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * ThemeContext — 3-state theme picker: 'light' | 'dark' | 'system'.
 * Applied as `data-theme` on the document root; `system` leaves it unset so
 * CSS `@media (prefers-color-scheme)` can drive the surface.
 * Choice is persisted to localStorage under `jara.theme`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext(null);

const STORAGE_KEY = 'jara.theme';

function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch { return 'system'; }
}

function systemDark() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Resolve a picker value to the actual mode being shown right now. */
function resolveMode(pref) {
  if (pref === 'dark')  return 'dark';
  if (pref === 'light') return 'light';
  return systemDark() ? 'dark' : 'light';
}

function applyMode(mode) {
  const el = document.documentElement;
  if (mode === 'dark') el.setAttribute('data-theme', 'dark');
  else el.removeAttribute('data-theme');
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(readStoredTheme);
  const [mode, setMode] = useState(() => resolveMode(readStoredTheme()));

  // Apply on mount + whenever the user picks a new preference.
  useEffect(() => {
    const nextMode = resolveMode(pref);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(nextMode);
    applyMode(nextMode);
    try { localStorage.setItem(STORAGE_KEY, pref); } catch { /* private mode */ }
  }, [pref]);

  // React to OS-level theme changes while pref === 'system'.
  useEffect(() => {
    if (pref !== 'system') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const next = mq.matches ? 'dark' : 'light';
      setMode(next);
      applyMode(next);
    };
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, [pref]);

  const setTheme = useCallback((value) => setPref(value), []);
  const toggle = useCallback(() => {
    // Cycle: light → dark → system → light
    setPref((p) => (p === 'light' ? 'dark' : p === 'dark' ? 'system' : 'light'));
  }, []);

  const value = useMemo(() => ({ pref, mode, setTheme, toggle }), [pref, mode, setTheme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
