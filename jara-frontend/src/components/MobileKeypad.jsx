import { Delete } from 'lucide-react';
import styles from './MobileKeypad.module.css';

/**
 * On-screen numeric keypad — matches the mobile PIN screens in the
 * mockups (1–9 with letter subtitles, 0, and a backspace key).
 * Fires a single `onKey(char)` callback: '0'..'9' or 'del'.
 */
const KEYS = [
  { d: '1', s: '' },
  { d: '2', s: 'ABC' },
  { d: '3', s: 'DEF' },
  { d: '4', s: 'GHI' },
  { d: '5', s: 'JKL' },
  { d: '6', s: 'MNO' },
  { d: '7', s: 'PQRS' },
  { d: '8', s: 'TUV' },
  { d: '9', s: 'WXYZ' },
];

export default function MobileKeypad({ onKey }) {
  return (
    <div className={styles.keypad}>
      {KEYS.map(({ d, s }) => (
        <button
          key={d}
          type="button"
          className={styles.key}
          onClick={() => onKey(d)}
          aria-label={d}
        >
          <span className={styles.digit}>{d}</span>
          {s && <span className={styles.subtitle}>{s}</span>}
        </button>
      ))}
      <div />   {/* empty slot bottom-left */}
      <button type="button" className={styles.key} onClick={() => onKey('0')} aria-label="0">
        <span className={styles.digit}>0</span>
      </button>
      <button type="button" className={styles.key} onClick={() => onKey('del')} aria-label="Backspace">
        <Delete size={22} />
      </button>
    </div>
  );
}
