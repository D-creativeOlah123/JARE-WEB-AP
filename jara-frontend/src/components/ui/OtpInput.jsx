import { useEffect, useId, useRef } from 'react';
import styles from './OtpInput.module.css';

/**
 * OtpInput — fixed-length numeric OTP, one box per digit.
 *
 *   - Caller controls `value` (string of 0–N digits) and `length`.
 *   - Typing a digit advances focus; Backspace on an empty box moves back.
 *   - Pasting a sequence auto-splits across boxes.
 *   - Emits raw digits only; onComplete fires once the final box is filled.
 *
 * @param {object} props
 * @param {string} props.value          current digits (length ≤ `length`)
 * @param {(v:string)=>void} props.onChange
 * @param {number} [props.length=6]
 * @param {(v:string)=>void} [props.onComplete]
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {boolean} [props.autoFocus=true]
 */
export default function OtpInput({
  value,
  onChange,
  length = 6,
  onComplete,
  label,
  error,
  autoFocus = true,
}) {
  const uid = useId();
  const refs = useRef([]);

  const digits = String(value || '').replace(/\D/g, '').slice(0, length).split('');
  while (digits.length < length) digits.push('');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function emit(nextArr) {
    const joined = nextArr.join('').slice(0, length);
    onChange(joined);
    if (joined.length === length && onComplete) onComplete(joined);
  }

  function handleChange(i, v) {
    const only = v.replace(/\D/g, '');
    if (!only) {
      // Clear this cell + stay here.
      const copy = [...digits];
      copy[i] = '';
      emit(copy);
      return;
    }
    const copy = [...digits];
    // If the user typed/pasted multiple digits in one event, scatter them.
    for (let k = 0; k < only.length && (i + k) < length; k++) {
      copy[i + k] = only[k];
    }
    emit(copy);
    const nextIdx = Math.min(length - 1, i + only.length);
    refs.current[nextIdx]?.focus();
  }

  function handleKey(i, e) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      refs.current[i - 1]?.focus();
      const copy = [...digits];
      copy[i - 1] = '';
      emit(copy);
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e) {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!paste) return;
    e.preventDefault();
    emit(paste.split(''));
    refs.current[Math.min(length - 1, paste.length - 1)]?.focus();
  }

  return (
    <div className={`${styles.wrap} ${error ? styles.wrapError : ''}`} role="group" aria-label={label || 'One-time code'}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.boxes} onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={`${uid}-${i}`}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className={styles.box}
            aria-invalid={error ? 'true' : undefined}
          />
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
