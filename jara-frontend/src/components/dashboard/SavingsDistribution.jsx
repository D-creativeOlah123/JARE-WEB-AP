import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatNaira } from '../../utils/format';
import styles from './SavingsDistribution.module.css';

/**
 * Donut chart + legend of where the user's total savings live.
 * `data` shape: [{ name, value, color }, ...]
 */
export default function SavingsDistribution({ data }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Savings Distribution</h3>
        <p className={styles.subtitle}>How your money is allocated</p>
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatNaira(v)}
              contentStyle={{
                background: 'rgba(20,10,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'white',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className={styles.legend}>
        {data.map((entry) => (
          <li key={entry.name}>
            <span className={styles.dot} style={{ background: entry.color }} />
            {entry.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
