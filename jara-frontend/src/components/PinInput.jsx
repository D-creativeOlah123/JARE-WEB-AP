import { useRef } from 'react';
import styles from './PinInput.module.css';

/**
 * A numeric PIN input rendered as N filled/empty boxes.
 * Under the hood it's a single hidden <input> — much simpler than juggling
 * refs across N inputs, and gives free mobile numeric keyboard + paste.
 *
 * Props:
 *   length   — number of digits (e.g. 4 for transfer PIN, 5 for OTP)
 *   value    — string of current digits
 *   onChange — (string) => void; called with only-digits truncated to length
 *   autoFocus (default true)
 */
export default function PinInput({ length = 4, value, onChange, autoFocus = true }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, length);
    onChange(digitsOnly);
  }

  function focus() {
    inputRef.current?.focus();
  }

  return (
    <div className={styles.wrap} onClick={focus} role="group" aria-label="PIN input">
      <input
        ref={inputRef}
        className={styles.hiddenInput}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={handleChange}
        autoFocus={autoFocus}
        autoComplete="one-time-code"
      />

      <div className={styles.boxes}>
        {Array.from({ length }, (_, i) => (
          <div
            key={i}
            className={`${styles.box} ${i === value.length ? styles.active : ''}`}
          >
            {value[i] ? <span className={styles.dot} /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
