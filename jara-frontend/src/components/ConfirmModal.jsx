import styles from './ConfirmModal.module.css';

/**
 * Small centered modal used for the "Confirm Transaction Details" /
 * "Confirm Goal Details" moments in the mockups. Renders over a dim
 * scrim. `open` controls visibility; parents own submission state.
 */
export default function ConfirmModal({
  open,
  title,
  rows = [],
  error,
  submitting,
  ctaLabel = 'Continue',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className={styles.scrim} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.rows}>
          {rows.map((r) => (
            <div key={r.label} className={styles.row}>
              <span className={styles.rowLabel}>{r.label}:</span>
              <span className={styles.rowValue}>{r.value}</span>
            </div>
          ))}
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? 'Please wait…' : ctaLabel}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
