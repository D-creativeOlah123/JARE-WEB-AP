import { createContext, useCallback, useMemo, useRef, useState } from 'react';

/**
 * ToastContext — host for ephemeral toasts shown via `useToast()`.
 *
 * Stays dependency-free. Each toast is `{ id, variant, title, body }` and
 * auto-dismisses after `duration` (default 4s). Variants map to the
 * semantic `*-soft` tokens.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback(
    ({ variant = 'info', title, body, duration = DEFAULT_DURATION } = {}) => {
      const id = nextIdRef.current++;
      setToasts((list) => [...list, { id, variant, title, body }]);
      if (duration > 0) {
        const t = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, t);
      }
      return id;
    },
    [dismiss],
  );

  // Shorthand helpers so callers write `toast.success('Saved')` etc.
  const api = useMemo(() => ({
    push,
    dismiss,
    toasts,
    success: (title, body) => push({ variant: 'success', title, body }),
    error:   (title, body) => push({ variant: 'danger',  title, body }),
    warn:    (title, body) => push({ variant: 'warning', title, body }),
    info:    (title, body) => push({ variant: 'info',    title, body }),
  }), [push, dismiss, toasts]);

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}
