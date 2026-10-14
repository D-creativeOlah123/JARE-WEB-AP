import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { formatNaira } from '../../utils/format';
import { useChartTheme } from '../../hooks/useChartTheme';
import styles from './FinancialSummary.module.css';

/**
 * FinancialSummary — this-month income + spend KPIs plus a 7-day
 * area-chart sparkline. Chart colours resolved via `useChartTheme` so
 * the surface swaps correctly in dark mode.
 *
 * @param {object} props
 * @param {number} props.incomeKobo
 * @param {number} props.spentKobo
 * @param {Array<{date:string,incomeKobo:number,spentKobo:number}>} [props.sparkline]
 *   last 7 points (any shape — chart just needs `date` + two kobo numbers).
 */
export default function FinancialSummary({ incomeKobo = 0, spentKobo = 0, sparkline = [] }) {
  const theme = useChartTheme();

  const data = sparkline.map((d) => ({
    date:   d.date,
    income: Math.round((d.incomeKobo || 0) / 100),
    spent:  Math.round((d.spentKobo || 0) / 100),
  }));

  return (
    <section className={styles.card}>
      <div className={styles.kpiRow}>
        <Kpi
          icon={ArrowDownLeft}
          tone="success"
          label="Income"
          sub="This month"
          value={formatNaira(incomeKobo / 100, { decimals: 2 })}
        />
        <Kpi
          icon={ArrowUpRight}
          tone="danger"
          label="Spent"
          sub="This month"
          value={formatNaira(spentKobo / 100, { decimals: 2 })}
        />
      </div>

      <div className={styles.chartWrap} aria-hidden="true">
        <ResponsiveContainer width="100%" height={80}>
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id="jara-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={theme.success || '#16A34A'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={theme.success || '#16A34A'} stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="jara-spent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={theme.primary || '#9B5A91'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={theme.primary || '#9B5A91'} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <Tooltip
              cursor={{ stroke: theme.border, strokeWidth: 1 }}
              contentStyle={{
                background: theme.bgElev,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                fontSize: 11,
                color: theme.text,
              }}
              formatter={(v, k) => [formatNaira(v), k === 'income' ? 'Income' : 'Spent']}
              labelFormatter={(l) => l}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke={theme.success}
              strokeWidth={1.6}
              fill="url(#jara-income)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="spent"
              stroke={theme.primary}
              strokeWidth={1.6}
              fill="url(#jara-spent)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Kpi({ icon: Icon, tone, label, sub, value }) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <div className={styles.kpiHead}>
        <span className={styles.kpiIcon}><Icon size={14} /></span>
        <div className={styles.kpiText}>
          <span className={styles.kpiLabel}>{label}</span>
          <span className={styles.kpiSub}>{sub}</span>
        </div>
      </div>
      <span className={styles.kpiValue}>{value}</span>
    </div>
  );
}
