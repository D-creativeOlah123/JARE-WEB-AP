import { Check } from 'lucide-react';
import styles from './AuthProgress.module.css';

/**
 * AuthProgress — 4-segment labelled progress bar for the Signup wizard.
 *
 * Each segment fills left-to-right as the user advances; the active step
 * glows; completed steps show a tick medallion.
 *
 * @param {object} props
 * @param {Array<string>} props.steps          labels, e.g. ['Details','PIN','Verify','Done']
 * @param {number} props.active                index of the currently-active step
 */
export default function AuthProgress({ steps, active }) {
  return (
    <ol className={styles.wrap} aria-label="Signup progress">
      {steps.map((label, i) => {
        const done   = i < active;
        const on     = i === active;
        return (
          <li
            key={label}
            className={`${styles.item} ${done ? styles.done : ''} ${on ? styles.on : ''}`}
            aria-current={on ? 'step' : undefined}
          >
            <span className={styles.dot}>
              {done ? <Check size={10} strokeWidth={3} /> : i + 1}
            </span>
            <span className={styles.label}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
