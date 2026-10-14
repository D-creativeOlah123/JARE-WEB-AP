import { useId, useRef } from 'react';
import styles from './AmountInput.module.css';

/**
 * AmountInput — naira amount with ₦ prefix and live thousands grouping.
 *
 * Emits raw kobo (integer) to the caller via `onChange(valueKobo)` so the
 * surrounding form never has to think about display formatting.
 *
 *   <AmountInput label="Amount" valueKobo={100_000} onChange={setKobo} />
 *
 * @param {object}   props
 * @param {string}   props.label
 * @param {number}   props.valueKobo         amount in kobo (integer); 0 for empty
 * @param {(kobo:number)=>void} props.onChange
 * @param {number}   [props.min=0]           lower bound in kobo
 * @param {number}   [props.max]             upper bound in kobo
 * @param {string}   [props.helper]
 * @param {string}   [props.error]
 * @param {boolean}  [props.disabled=false]
 */
export default function AmountInput({
  label,
  valueKobo,
  onChange,
  min = 0,
  max,
  helper,
  error,
  disabled = false,
}) {
  const uid = useId();
  const inputId = `amt-${uid}`;
  const helperId = `${inputId}-helper`;
  const errorId  = `${inputId}-error`;
  const inputRef = useRef(null);

  // Display: 100_000 kobo → "1,000". Preserve a trailing `.NN` the user is typing.
  const display = formatForInput(valueKobo);

  function handleChange(e) {
    // Strip anything but digits + at most one dot.
    const raw = e.target.value
      .replace(/[^\d.]/g, '')
      .replace(/^(\d*\.\d{0,2}).*$/, '$1');   // cap at 2 decimals
    if (raw === '') { onChange(0); return; }
    // naira (possibly with .kk) → kobo
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    let kobo = Math.round(n * 100);
    if (max !== undefined && kobo > max) kobo = max;
    if (kobo < min) kobo = min;
    onChange(kobo);
  }

  return (
    <div className={`${styles.wrap} ${error ? styles.wrapError : ''}`}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <div className={styles.field}>
        <span className={styles.prefix} aria-hidden="true">₦</span>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={display}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`${label} in naira`}
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

/** Format a kobo integer as a human string suitable for the input's value. */
function formatForInput(kobo) {
  if (!kobo && kobo !== 0) return '';
  if (kobo === 0) return '';
  const naira = kobo / 100;
  const [whole, frac] = naira.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac === '00' ? grouped : `${grouped}.${frac}`;
}
