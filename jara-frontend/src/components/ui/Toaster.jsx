import { useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext';
import styles from './Toaster.module.css';

const ICONS = {
  success: CheckCircle2,
  danger:  AlertCircle,
  warning: AlertTriangle,
  info:    Info,
};

/**
 * Toaster — renders the active toast stack. Place once near the root
 * (inside `ToastProvider`). Toasts auto-dismiss; a close button is also
 * provided for manual dismissal.
 *
 * Live-region policy: the container is `aria-live="polite"` so screen
 * readers announce new toasts without interrupting a flow in progress.
 */
export default function Toaster() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div className={styles.wrap} aria-live="polite" aria-label="Notifications">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant] || Info;
        return (
          <div key={t.id} className={`${styles.toast} ${styles[`v_${t.variant}`]}`} role="status">
            <Icon size={16} className={styles.icon} aria-hidden="true" />
            <div className={styles.text}>
              {t.title && <span className={styles.title}>{t.title}</span>}
              {t.body  && <span className={styles.body}>{t.body}</span>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className={styles.close}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
