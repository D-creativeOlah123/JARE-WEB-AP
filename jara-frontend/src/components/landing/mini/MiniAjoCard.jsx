import { Users } from 'lucide-react';
import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { formatNaira } from '../../../utils/format';
import styles from './MiniAjoCard.module.css';

/**
 * MiniAjoCard — marketing replica of the app's Ajo (pooled savings) card.
 *
 * Shape of `ajo`:
 *   {
 *     name: 'Umeh Family Rent',
 *     target: 1800000, saved: 1200000,
 *     members: ['CO', 'AB', 'TA', 'NU', 'YI'],
 *     nextLabel: 'Next contribution',
 *     nextDate: 'Fri 10 Oct · ₦50,000',
 *   }
 */
export default function MiniAjoCard({ ajo }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.4, once: true });
  const pct = Math.round((ajo.saved / ajo.target) * 100);
  const progressReady = reduced || inView;

  return (
    <article ref={ref} className={styles.card} aria-labelledby="miniajo-title">
      <header className={styles.head}>
        <div className={styles.icon}><Users size={16} /></div>
        <div className={styles.titleCol}>
          <span id="miniajo-title" className={styles.title}>{ajo.name}</span>
          <span className={styles.sub}>
            {formatNaira(ajo.saved)} of {formatNaira(ajo.target)}
          </span>
        </div>
        <ul className={styles.members} aria-label={`${ajo.members.length} members`}>
          {ajo.members.map((initials, i) => (
            <li
              key={`${initials}-${i}`}
              className={styles.member}
              style={{ '--i': i }}
              aria-hidden="true"
            >
              {initials}
            </li>
          ))}
        </ul>
      </header>

      <div
        className={styles.track}
        style={{ '--progress': `${progressReady ? pct : 0}%` }}
      >
        <span className={styles.fill} aria-hidden="true" />
      </div>

      <footer className={styles.foot}>
        <span className={styles.footLabel}>{ajo.nextLabel}</span>
        <span className={styles.footValue}>{ajo.nextDate}</span>
      </footer>
    </article>
  );
}
