import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './ErrorState.module.css';

/**
 * ErrorState — the "something went wrong" block with optional retry.
 *
 *   <ErrorState title="Couldn't load transfers"
 *               detail={apiMessage}
 *               reference={result?.reference}
 *               onRetry={refresh} />
 *
 * The detail string is shown verbatim when provided; prefer passing the
 * server's `error.message` so the user sees the specific reason.
 */
export default function ErrorState({ title = 'Something went wrong', detail, reference, onRetry, className = '' }) {
  return (
    <section className={`${styles.wrap} ${className}`} role="alert">
      <div className={styles.icon}><AlertTriangle size={22} /></div>
      <h3 className={styles.title}>{title}</h3>
      {detail && <p className={styles.detail}>{detail}</p>}
      {reference && <code className={styles.ref}>ref: {reference}</code>}
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${styles.cta} btn-lift`}>
          <RefreshCw size={14} /> Try again
        </button>
      )}
    </section>
  );
}

export function InlineError({ message, onRetry, className = '' }) {
  if (!message) return null;
  return (
    <div className={`${styles.inline} ${className}`} role="alert">
      <AlertTriangle size={14} aria-hidden="true" />
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.inlineRetry}>Retry</button>
      )}
    </div>
  );
}
