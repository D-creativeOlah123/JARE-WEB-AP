import { useId } from 'react';
import styles from './Toggle.module.css';

/**
 * Toggle — accessible on/off switch.
 *
 *   <Toggle label="Dark mode" on={dark} onToggle={() => setDark(d => !d)} />
 *
 * Renders as `role="switch"` with proper `aria-checked`. Keyboard: Space/Enter.
 *
 * @param {object}  props
 * @param {string}  props.label
 * @param {string}  [props.description]
 * @param {boolean} props.on
 * @param {()=>void} props.onToggle
 * @param {boolean} [props.disabled=false]
 */
export default function Toggle({ label, description, on, onToggle, disabled = false }) {
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;

  function handleKey(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  return (
    <label className={styles.row} htmlFor={uid}>
      <div className={styles.text}>
        <span className={styles.label}>{label}</span>
        {description && <span id={descId} className={styles.description}>{description}</span>}
      </div>
      <button
        id={uid}
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={descId}
        disabled={disabled}
        onClick={() => !disabled && onToggle()}
        onKeyDown={handleKey}
        className={`${styles.switch} ${on ? styles.switchOn : ''}`}
      >
        <span className={styles.knob} aria-hidden="true" />
      </button>
    </label>
  );
}
