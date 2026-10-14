import { useId } from 'react';
import styles from './PhoneInput.module.css';

/**
 * PhoneInput — Nigerian phone input with a locked +234 prefix.
 *
 * Accepts digits only in the 10-digit local segment. Caller receives
 * the full international string via `onChange('+2348012345678')`, so
 * the shape matches `User.phone` on the backend exactly.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value              '+2348…' (12 chars) or ''
 * @param {(v:string)=>void} props.onChange
 * @param {string} [props.helper]
 * @param {string} [props.error]
 * @param {boolean} [props.disabled=false]
 */
export default function PhoneInput({
  label,
  value,
  onChange,
  helper,
  error,
  disabled = false,
}) {
  const uid = useId();
  const inputId = `tel-${uid}`;
  const helperId = `${inputId}-helper`;
  const errorId  = `${inputId}-error`;

  // Local segment: strip the +234 prefix if present.
  const local = (value || '').replace(/^\+234/, '');

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(digits ? `+234${digits}` : '');
  }

  return (
    <div className={`${styles.wrap} ${error ? styles.wrapError : ''}`}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <div className={styles.field}>
        <span className={styles.prefix} aria-hidden="true">+234</span>
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="8012345678"
          value={local}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          className={styles.input}
        />
      </div>
      {error
        ? <p id={errorId} className={styles.error}>{error}</p>
        : helper
          ? <p id={helperId} className={styles.helper}>{helper}</p>
          : null}
    </div>
  );
}
