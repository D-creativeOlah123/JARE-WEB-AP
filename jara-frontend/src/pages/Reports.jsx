import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Target, Users,
  Award, Users2, Flame, Calendar,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { formatNaira } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { listTransfers } from '../services/transfers';
import { listServiceHistory } from '../services/serviceTx';
import { listGoals } from '../services/goals';
import { listGroups } from '../services/groups';
import Skeleton from '../components/Skeleton';
import { useChartTheme } from '../hooks/useChartTheme';
import styles from './Reports.module.css';

const PERIODS = [
  { id: 'week',  label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year',  label: 'This Year' },
];

function periodStart(id) {
  const now = new Date();
  if (id === 'week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (id === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start;
  }
  return new Date(now.getFullYear(), 0, 1);
}

function pctDelta(current, prior) {
  if (!prior) return current > 0 ? 100 : 0;
  return Math.round(((current - prior) / prior) * 100);
}

/** Compute all Reports state from ledger data client-side. */
function computeReport({
  period, transfers, services, goals, groups, myUserId,
}) {
  const start = periodStart(period);
  const priorStart = new Date(start);
  const priorEnd   = new Date(start);
  if (period === 'week')  priorStart.setDate(priorStart.getDate() - 7);
  if (period === 'month') priorStart.setMonth(priorStart.getMonth() - 1);
  if (period === 'year')  priorStart.setFullYear(priorStart.getFullYear() - 1);

  // Savings = personal goal contributions + group contributions in the window
  // We approximate personal saved from goal.savedAmount + groups.savedAmount
  // as *cumulative* (whole-time), and use ledger movement for period figures.

  // Withdrawn = all outgoing transfers + service purchases in the window.
  let withdrawnCur = 0, withdrawnPrior = 0;
  let savedCur = 0, savedPrior = 0;   // net incoming (received transfers)
  let spendServices = 0;
  let spendTransfers = 0;

  const monthly = new Map();  // "YYYY-MM" → { groupGoals, personalGoals }

  const inWindow = (d) => d >= start;
  const inPrior  = (d) => d >= priorStart && d < priorEnd;

  for (const t of transfers) {
    if (t.status !== 'completed') continue;
    const d = new Date(t.createdAt);
    const outgoing = String(t.fromUserId) === String(myUserId);
    if (outgoing) {
      if (inWindow(d)) { withdrawnCur += t.amount; spendTransfers += t.amount; }
      else if (inPrior(d)) withdrawnPrior += t.amount;
    } else if (inWindow(d)) {
      savedCur += t.amount;
    } else if (inPrior(d)) {
      savedPrior += t.amount;
    }
  }
  for (const s of services) {
    if (s.status !== 'completed') continue;
    const d = new Date(s.createdAt);
    if (inWindow(d)) { withdrawnCur += s.amount; spendServices += s.amount; }
    else if (inPrior(d)) withdrawnPrior += s.amount;
  }

  const goalsSaved  = goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
  const groupsSaved = groups.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
  const totalSavedAllTime = goalsSaved + groupsSaved;

  // Build a 7-bucket monthly trend for the last 7 months (regardless of period).
  const now = new Date();
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets.push({ key, month: d.toLocaleString('en', { month: 'short' }) });
    monthly.set(key, { month: d.toLocaleString('en', { month: 'short' }), groupGoals: 0, personalGoals: 0 });
  }
  // Approximation: use received-transfers as a rough personal "saved" trace.
  // Real per-month goal contributions would need a /reports endpoint.
  for (const t of transfers) {
    if (t.status !== 'completed') continue;
    if (String(t.toUserId) !== String(myUserId)) continue;
    const d = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const b = monthly.get(key);
    if (b) b.personalGoals += t.amount;
  }
  const trend = buckets.map((b) => monthly.get(b.key));

  // Highest personal goal (savedAmount)
  const topGoal = [...goals].sort((a, b) => (b.savedAmount || 0) - (a.savedAmount || 0))[0];
  const topGroup = [...groups].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

  const activeGoals  = goals.filter((g) => g.status === 'active').length;
  const activeGroups = groups.filter((g) => (g.status ?? 'active') === 'active').length;

  return {
    savedCurNaira:      Math.round(savedCur / 100),
    savedPriorNaira:    Math.round(savedPrior / 100),
    withdrawnCurNaira:  Math.round(withdrawnCur / 100),
    withdrawnPriorNaira:Math.round(withdrawnPrior / 100),
    totalSavedAllTime,
    activeGoals,
    activeGroups,
    milestones: [
      { name: 'Personal Goals', value: goalsSaved,  color: '#9B5A91' },
      { name: 'Group Goals',    value: groupsSaved, color: '#D4B4CE' },
    ],
    spendVsSaved: [
      { name: 'Savings',   value: Math.round(savedCur / 100) },
      { name: 'Transfers', value: Math.round(spendTransfers / 100) },
      { name: 'Services',  value: Math.round(spendServices / 100) },
    ],
    monthlyTrend: trend.map((b) => ({
      month:         b.month,
      groupGoals:    Math.round(b.groupGoals / 100),
      personalGoals: Math.round(b.personalGoals / 100),
    })),
    topGoal,
    topGroup,
  };
}

export default function Reports() {
  const { user } = useAuth();
  const theme = useChartTheme();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [services,  setServices]  = useState([]);
  const [goals,     setGoals]     = useState([]);
  const [groups,    setGroups]    = useState([]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      listTransfers({ limit: 200 }).catch(() => []),
      listServiceHistory().catch(() => []),
      listGoals().catch(() => []),
      listGroups().catch(() => []),
    ]).then(([t, s, g, gr]) => {
      if (cancelled) return;
      setTransfers(t); setServices(s); setGoals(g); setGroups(gr);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const report = useMemo(
    () => computeReport({ period, transfers, services, goals, groups, myUserId: user?.id }),
    [period, transfers, services, goals, groups, user?.id],
  );

  const savedDelta     = pctDelta(report.savedCurNaira, report.savedPriorNaira);
  const withdrawnDelta = pctDelta(report.withdrawnCurNaira, report.withdrawnPriorNaira);

  const milestoneTotal = report.milestones.reduce((s, m) => s + m.value, 0) || 1;
  const milestonePcts  = report.milestones.map((m) => ({
    ...m, pct: Math.round((m.value / milestoneTotal) * 100),
  }));

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Reports</h1>
        <p className={styles.subtitle}>Analyze your savings, transfers, and spending patterns.</p>
      </header>

      <div className={styles.periods}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.periodTab} ${period === p.id ? styles.periodActive : ''}`}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <>
          <section className={styles.kpiGrid} aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.kpi}>
                <Skeleton width={26} height={26} radius="50%" />
                <Skeleton width="70%" height={16} />
                <Skeleton width="45%" height={10} />
              </div>
            ))}
          </section>
          <section className={styles.card}><Skeleton width="40%" height={14} /><Skeleton height={140} radius={12} /></section>
          <section className={styles.card}><Skeleton width="40%" height={14} /><Skeleton height={140} radius={12} /></section>
        </>
      ) : (
        <>
          <section className={styles.kpiGrid}>
            <KpiTile
              icon={TrendingUp}
              label="Received"
              value={formatNaira(report.savedCurNaira)}
              delta={savedDelta}
              tone="up"
            />
            <KpiTile
              icon={TrendingDown}
              label="Total Spent"
              value={formatNaira(report.withdrawnCurNaira)}
              delta={withdrawnDelta}
              tone="down"
            />
            <KpiTile icon={Target} label="Active Goals"  value={report.activeGoals} />
            <KpiTile icon={Users}  label="Active Groups" value={report.activeGroups} />
          </section>

          {/* Recent Milestones donut */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Savings Split</h3>
            {milestoneTotal <= 1 ? (
              <p className={styles.cardHint}>No goal savings yet.</p>
            ) : (
              <>
                <div className={styles.donutWrap}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={milestonePcts} dataKey="value" nameKey="name"
                        innerRadius={50} outerRadius={72} stroke="none"
                      >
                        {milestonePcts.map((m) => <Cell key={m.name} fill={m.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className={styles.legend}>
                  {milestonePcts.map((m) => (
                    <li key={m.name}>
                      <span className={styles.dot} style={{ background: m.color }} />
                      {m.name}
                      <span className={styles.legendPct}>{m.pct}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Spending vs Savings */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Spending vs Savings</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={report.spendVsSaved} layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} horizontal={false} />
                  <XAxis type="number" tick={{ fill: theme.textMuted, fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: theme.textMuted, fontSize: 11 }}
                    tickLine={false} axisLine={false} width={72} />
                  <Tooltip
                    formatter={(v) => formatNaira(v)}
                    cursor={{ fill: `color-mix(in oklab, ${theme.primary} 6%, transparent)` }}
                    contentStyle={{
                      background: theme.bgElev, border: `1px solid ${theme.border}`,
                      borderRadius: 8, fontSize: 12, color: theme.text,
                    }}
                  />
                  <Bar dataKey="value" fill={theme.primary} radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Monthly Savings Trend */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Received (last 7 months)</h3>
            <div className={styles.chartWrap}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.monthlyTrend}
                  margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: theme.textMuted, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: theme.textMuted, fontSize: 10 }} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} />
                  <Tooltip
                    formatter={(v) => formatNaira(v)}
                    contentStyle={{
                      background: theme.bgElev, border: `1px solid ${theme.border}`,
                      borderRadius: 8, fontSize: 12, color: theme.text,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: theme.textMuted }} iconSize={8} />
                  <Bar dataKey="personalGoals" name="Received transfers"
                    fill={theme.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Insights */}
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Insights</h3>
            <ul className={styles.insights}>
              {report.topGoal ? (
                <InsightRow icon={Award} title="Highest personal goal"
                  body={`${report.topGoal.name} — ${formatNaira(report.topGoal.savedAmount / 100)}`} />
              ) : (
                <InsightRow icon={Award} title="Highest personal goal"
                  body="Create a goal to see it here" />
              )}
              {report.topGroup ? (
                <InsightRow icon={Users2} title="Longest-running group"
                  body={`${report.topGroup.name} — since ${new Date(report.topGroup.createdAt).toLocaleString('en', { month: 'short', year: 'numeric' })}`} />
              ) : (
                <InsightRow icon={Users2} title="Longest-running group"
                  body="Join or start a group" />
              )}
              <InsightRow icon={Flame} title="Total lifetime savings"
                body={formatNaira(report.totalSavedAllTime / 100)} />
              <InsightRow icon={Calendar} title="Period"
                body={PERIODS.find((p) => p.id === period).label} />
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, delta, tone }) {
  const showDelta = delta !== undefined;
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiHead}>
        <div className={styles.kpiIcon}><Icon size={14} /></div>
        {showDelta && (
          <span className={`${styles.kpiDelta} ${tone === 'up' ? styles.up : styles.down}`}>
            {delta > 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
      <span className={styles.kpiValue}>{value}</span>
      <span className={styles.kpiLabel}>{label}</span>
    </div>
  );
}

function InsightRow({ icon: Icon, title, body }) {
  return (
    <li className={styles.insightRow}>
      <div className={styles.insightIcon}><Icon size={14} /></div>
      <div className={styles.insightText}>
        <span className={styles.insightTitle}>{title}</span>
        <span className={styles.insightBody}>{body}</span>
      </div>
    </li>
  );
}
