import { useCallback, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Sheet.module.css';

/**
 * Sheet — a bottom sheet rendered inline so it sits inside the customer
 * phone frame (and docks to the bottom-right on wide admin views).
 *
 *   - `open` controls visibility.
 *   - Focus is trapped inside; `Esc` closes; scrim click closes.
 *   - On close, focus is restored to whatever had focus when it opened.
 *   - The sheet body scrolls, not the page behind it (`overscroll-behavior: contain`).
 *
 * `SuccessSheet` and `ConfirmModal` can later become thin wrappers around this.
 *
 * @param {object} props
 * @param {boolean}  props.open
 * @param {()=>void} props.onClose
 * @param {string}   props.title             shown in the header
 * @param {React.ReactNode} [props.footer]   sticky bottom actions row
 * @param {React.ReactNode} props.children
 */
export default function Sheet({ open, onClose, title, footer, children }) {
  const uid = useId();
  const sheetRef = useRef(null);

  const handleClose = useCallback(() => onClose?.(), [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); return; }
      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = sheet.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);

    // Autofocus the first focusable (or the close button).
    const target =
      sheetRef.current?.querySelector('input, button, a, [tabindex="0"]')
      || sheetRef.current;
    target?.focus?.();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className={styles.scrim} onClick={handleClose}>
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className={styles.sheet}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.head}>
          <span className={styles.handle} aria-hidden="true" />
          <h2 id={`${uid}-title`} className={styles.title}>{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className={styles.close}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.foot}>{footer}</footer>}
      </div>
    </div>
  );
}
