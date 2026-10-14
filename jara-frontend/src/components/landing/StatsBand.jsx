import { stats as copy } from '../../data/landing';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import CountUp from './motion/CountUp';
import styles from './StatsBand.module.css';

/**
 * StatsBand — four big CountUp figures on a dark band.
 *
 *   - Each tile runs its own `CountUp` on scroll-in (already in-view-gated).
 *   - All four figures are flagged `TODO(confirm)` in `CLAIMS_TO_CONFIRM.md`.
 */
export default function StatsBand() {
  const { heading, items } = copy;
  return (
    <Band tone="dark" id="stats" labelledBy="stats-title">
      <SectionHeading
        id="stats-title"
        eyebrow={heading.eyebrow}
        title={heading.title}
        italic={heading.italic}
        align="center"
      />

      <ul className={styles.grid} role="list">
        {items.map((s, i) => (
          <li
            key={s.label}
            className={styles.item}
            style={{ '--stat-stagger': `${i * 100}ms` }}
          >
            <span className={styles.value}>
              <CountUp
                to={s.to}
                prefix={s.prefix || ''}
                suffix={s.suffix || ''}
                decimals={s.decimals || 0}
                duration={1400}
              />
            </span>
            <span className={styles.label}>{s.label}</span>
          </li>
        ))}
      </ul>
    </Band>
  );
}
