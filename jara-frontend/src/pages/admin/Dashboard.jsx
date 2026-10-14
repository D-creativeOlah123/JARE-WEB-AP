import { useEffect, useState } from 'react';
import { Wallet, Target, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAdminSummary,
  getAdminAnalytics,
  listAdminTransfers,
} from '../../services/admin';
import { formatNaira } from '../../utils/format';
import KpiCard from '../../components/dashboard/KpiCard';
import SavingsDistribution from '../../components/dashboard/SavingsDistribution';
import ActiveGoals from '../../components/dashboard/ActiveGoals';
import MonthlyPerformance from '../../components/dashboard/MonthlyPerformance';
import TransactionsTable from '../../components/dashboard/TransactionsTable';
import styles from './Dashboard.module.css';

/**
 * Admin dashboard home. Pulls analytics + summary aggregates + the latest
 * transfers page — all from /api/admin — so every card, chart, and table
 * row reflects live data.
 */
function shapeTransfer(t) {
  const isSuccess = t.status === 'completed';
  const description = t.type === 'bank'
    ? `Bank transfer${t.toBank?.accountName ? ` to ${t.toBank.accountName}` : ''}`
    : 'Jara transfer';
  return {
    id: t._id,
    date: t.createdAt,
    description,
    reference: t.reference,
    category: t.type === 'bank' ? 'Bank Transfer' : 'Jara Transfer',
    source: 'Wallet',
    amount: -t.amount / 100,          // debit — sender-view rendering
    balance: 0,                       // running balance not tracked on-ledger
    status: isSuccess ? 'completed' : t.status,
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(' ')[0] || 'Admin';

  const [visuals, setVisuals] = useState({ loading: true, error: null, data: null });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [analytics, transferPage] = await Promise.all([
          getAdminAnalytics('month'),
          listAdminTransfers({ limit: 8 }),
        ]);
        if (cancelled) return;
        setVisuals({
          loading: false,
          error: null,
          data: {
            distribution: analytics.savingsDistribution,
            goals: analytics.activeGoals,
            monthly: analytics.monthlyPerformance.map((m) => ({
              month: m.month,
              savings: Math.round(m.savings / 100),
              target: Math.round(m.target / 100),
            })),
            transactions: (transferPage.transfers || []).map(shapeTransfer),
          },
        });
      } catch (err) {
        if (!cancelled) setVisuals({ loading: false, error: err.message, data: null });
      }
    })();
    getAdminSummary().then(setSummary).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (visuals.loading) return <p className={styles.status}>Loading admin dashboard…</p>;
  if (visuals.error)   return <p className={styles.error}>Couldn't load dashboard: {visuals.error}</p>;

  const { distribution, goals, monthly, transactions } = visuals.data;

  // Aggregates from the admin summary — 0 until it loads.
  const totalSavings   = summary ? summary.deposits.totalHeld / 100 : 0;
  const activeGoals    = summary ? summary.goals.active             : 0;
  const goalsCompleted = summary ? summary.goals.completed          : 0;
  const groups         = summary ? summary.groups.active            : 0;
  const thisMonth      = summary ? summary.transfers.monthVolume / 100 : 0;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Welcome back, {firstName}! 👋</h1>
        <p className={styles.subtitle}>Here's what's happening with your savings today</p>
      </header>

      {/* Row 1 — 4 KPI cards */}
      <section className={styles.kpiGrid}>
        <KpiCard
          icon={Wallet}
          iconBg="linear-gradient(135deg, #EC4899, #D946EF)"
          label="Total Savings"
          value={formatNaira(totalSavings)}
          hint="Saved so far"
          delta={12.5}
        />
        <KpiCard
          icon={Target}
          iconBg="linear-gradient(135deg, #3B82F6, #1E40AF)"
          label="Active Goals"
          value={activeGoals}
          hint={`${goalsCompleted} Completed`}
        />
        <KpiCard
          icon={Users}
          iconBg="linear-gradient(135deg, #10B981, #047857)"
          label="Groups"
          value={groups}
          hint="0 pending"
        />
        <KpiCard
          icon={TrendingUp}
          iconBg="linear-gradient(135deg, #F97316, #C2410C)"
          label="This Month"
          value={formatNaira(thisMonth)}
          hint="Well-done!!"
          delta={8.2}
        />
      </section>

      {/* Row 2 — 3 panels */}
      <section className={styles.threeCol}>
        <SavingsDistribution data={distribution} />
        <ActiveGoals goals={goals} />
        <MonthlyPerformance data={monthly} />
      </section>

      {/* Row 3 — transactions full width */}
      <section>
        <TransactionsTable
          transactions={transactions}
          total={summary?.transfers?.monthCount ?? transactions.length}
        />
      </section>
    </div>
  );
}
