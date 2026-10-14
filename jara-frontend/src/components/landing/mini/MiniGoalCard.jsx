import { Target } from 'lucide-react';
import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import CountUp from '../motion/CountUp';
import { formatNaira } from '../../../utils/format';
import styles from './MiniGoalCard.module.css';

/**
 * MiniGoalCard — marketing replica of the app's goal card.
 *
 *   - Progress bar animates 0 → `pct`% on scroll-in (CSS transition on
 *     `--progress`), then stays there.
 *   - Saved amount `CountUp`s on scroll-in via the existing primitive.
 *   - Reduced motion: fills immediately; no CountUp scramble.
 *
 * Shape of `goal`:
 *   { name: 'New Laptop', target: 450000, saved: 306000, pct: 68 }
 */
export default function MiniGoalCard({ goal }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.4, once: true });
  const progressReady = reduced || inView;

  return (
    <article ref={ref} className={styles.card} aria-labelledby="minigoal-title">
      <header className={styles.head}>
        <div className={styles.icon}><Target size={16} /></div>
        <div className={styles.titleCol}>
          <span id="minigoal-title" className={styles.title}>{goal.name}</span>
          <span className={styles.sub}>Target {formatNaira(goal.target)}</span>
        </div>
        <span className={styles.pct} aria-label={`${goal.pct} percent saved`}>
          {goal.pct}%
        </span>
      </header>

      <div
        className={styles.track}
        style={{ '--progress': `${progressReady ? goal.pct : 0}%` }}
      >
        <span className={styles.fill} aria-hidden="true" />
      </div>

      <footer className={styles.foot}>
        <span className={styles.footLabel}>Saved</span>
        <span className={styles.footValue}>
          <CountUp to={goal.saved} naira />
        </span>
      </footer>
    </article>
  );
}
