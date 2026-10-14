import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPercent } from '../../utils/format';
import styles from './KpiCard.module.css';

/**
 * Reusable metric tile for the top row of the dashboard.
 * - `iconBg` sets the coloured pill behind the icon (matches the design).
 * - `delta` is optional — percentage change vs previous period; green up
 *   or red down arrow.
 */
export default function KpiCard({ icon: Icon, iconBg, label, value, hint, delta }) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;
  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <div className={styles.iconWrap} style={{ background: iconBg }}>
          <Icon size={22} color="white" />
        </div>
        {delta !== undefined && (
          <div className={`${styles.delta} ${isPositive ? styles.deltaUp : ''} ${isNegative ? styles.deltaDown : ''}`}>
            {isPositive ? <ArrowUpRight size={14} /> : isNegative ? <ArrowDownRight size={14} /> : null}
            {formatPercent(delta)}
          </div>
        )}
      </div>

      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
