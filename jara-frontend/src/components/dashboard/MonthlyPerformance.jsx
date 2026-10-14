import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNaira } from '../../utils/format';
import styles from './MonthlyPerformance.module.css';

/**
 * Grouped bar chart — savings actual vs monthly target.
 * `data` shape: [{ month: 'May', savings: 62000, target: 80000 }, ...]
 */
export default function MonthlyPerformance({ data }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Monthly Performance</h3>
        <p className={styles.subtitle}>Savings vs Target</p>
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₦${v / 1000}k`}
            />
            <Tooltip
              formatter={(v) => formatNaira(v)}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={{
                background: 'rgba(20,10,30,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: 'white',
              }}
            />
            <Bar dataKey="target" fill="rgba(255,255,255,0.15)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="savings" fill="#C24FA5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
