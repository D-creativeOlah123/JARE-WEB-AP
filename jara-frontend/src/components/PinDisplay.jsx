import styles from './PinDisplay.module.css';

/**
 * Display-only pin boxes. Fed by a MobileKeypad in the parent — this
 * component renders one box per position, filled with a dot when that
 * position is complete.
 */
export default function PinDisplay({ length = 4, value = '' }) {
  return (
    <div className={styles.wrap}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} className={`${styles.box} ${value[i] ? styles.boxFilled : ''}`}>
          {value[i] && <span className={styles.dot} />}
        </div>
      ))}
    </div>
  );
}
