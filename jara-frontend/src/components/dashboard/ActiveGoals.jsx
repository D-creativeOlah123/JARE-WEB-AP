import { Link } from 'react-router-dom';
import { formatNaira } from '../../utils/format';
import styles from './ActiveGoals.module.css';

/**
 * Progress list for the user's top goals. Each bar's width is derived
 * from saved/target — clamped to 0..100 so any weird backend data doesn't
 * overflow the bar visually.
 */
export default function ActiveGoals({ goals }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Active Goals</h3>
          <p className={styles.subtitle}>Track your progress</p>
        </div>
      </div>

      <ul className={styles.list}>
        {goals.map((g) => {
          const pct = Math.max(0, Math.min(100, (g.saved / g.target) * 100));
          return (
            <li key={g.id} className={styles.row}>
              <div className={styles.rowHead}>
                <span className={styles.rowName}>{g.name}</span>
                <span className={styles.rowPct}>{Math.round(pct)}%</span>
              </div>
              <div className={styles.rowSub}>
                {formatNaira(g.saved)} of {formatNaira(g.target)}
              </div>
              <div className={styles.track}>
                <div
                  className={styles.fill}
                  style={{ width: `${pct}%`, background: g.color }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <Link to="/my-jara" className={styles.viewAll}>View All Goals →</Link>
    </div>
  );
}
