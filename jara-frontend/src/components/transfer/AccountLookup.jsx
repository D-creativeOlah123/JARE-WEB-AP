import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import styles from './AccountLookup.module.css';

/**
 * AccountLookup — small status strip under a bank-account input.
 *
 *   state === 'idle'    → nothing
 *   state === 'looking' → "Looking up…" with a spinner
 *   state === 'found'   → "Account verified · <holder>" green
 *   state === 'error'   → red failure line
 *
 * Caller is responsible for debouncing + firing the lookup; this
 * component is pure presentation.
 */
export default function AccountLookup({ state, name, error }) {
  if (state === 'idle') return null;
  if (state === 'looking') {
    return (
      <div className={`${styles.row} ${styles.looking}`} aria-live="polite">
        <Loader2 size={14} className={styles.spin} aria-hidden="true" />
        <span>Looking up account…</span>
      </div>
    );
  }
  if (state === 'found') {
    return (
      <div className={`${styles.row} ${styles.found}`} aria-live="polite">
        <CheckCircle2 size={14} aria-hidden="true" />
        <span>
          <strong>{name}</strong>
        </span>
      </div>
    );
  }
  return (
    <div className={`${styles.row} ${styles.error}`} aria-live="polite" role="alert">
      <AlertCircle size={14} aria-hidden="true" />
      <span>{error || 'Couldn\'t verify this account.'}</span>
    </div>
  );
}
