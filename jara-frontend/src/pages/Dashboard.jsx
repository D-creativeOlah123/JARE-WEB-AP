import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getMyAccount } from '../services/accounts';
import { listTransfers } from '../services/transfers';
import { listServiceHistory } from '../services/serviceTx';
import { listGoals } from '../services/goals';
import Header from '../components/home/Header';
import BalanceCard from '../components/home/BalanceCard';
import QuickActions from '../components/home/QuickActions';
import FinancialSummary from '../components/home/FinancialSummary';
import GoalsStrip from '../components/home/GoalsStrip';
import TransactionHistory from '../components/home/TransactionHistory';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import styles from './Dashboard.module.css';

/**
 * Mobile Home — Phase C composition.
 *
 * Loads four streams: wallet · transfers · services · goals. Each failure
 * is treated independently (Promise.allSettled) so one broken stream
 * never blocks the rest — matches the brief's "partial-failure" state.
 */
export default function Dashboard() {
  const { user } = useAuth();

  const [account, setAccount]     = useState(null);
  const [acctLoading, setAcctLoading] = useState(true);
  const [acctError, setAcctError]     = useState('');

  const [income, setIncome] = useState(0);
  const [spent,  setSpent]  = useState(0);
  const [spark,  setSpark]  = useState([]);

  const [goals, setGoals]           = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  // Wallet
  useEffect(() => {
    getMyAccount()
      .then((a) => { setAccount(a); setAcctError(''); })
      .catch((err) => setAcctError(err?.response?.data?.error?.message || err?.message || 'Could not load wallet'))
      .finally(() => setAcctLoading(false));
  }, []);

  // This-month totals + 7-day sparkline
  useEffect(() => {
    if (!user?.id) return;
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const weekStart  = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
    let cancelled = false;

    (async () => {
      const [t, s] = await Promise.allSettled([
        listTransfers({ limit: 100 }),
        listServiceHistory(),
      ]);
      if (cancelled) return;
      const transfers = t.status === 'fulfilled' ? t.value : [];
      const services  = s.status === 'fulfilled' ? s.value : [];

      let inc = 0, spd = 0;
      // 7-day buckets keyed by YYYY-MM-DD
      const buckets = new Map();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const k = d.toISOString().slice(0, 10);
        buckets.set(k, { date: d.toLocaleDateString('en', { weekday: 'short' }), incomeKobo: 0, spentKobo: 0 });
      }

      for (const tx of transfers) {
        if (tx.status !== 'completed') continue;
        const d = new Date(tx.createdAt);
        const outgoing = String(tx.fromUserId) === String(user.id);
        if (d >= monthStart) { outgoing ? spd += tx.amount : inc += tx.amount; }
        if (d >= weekStart) {
          const key = d.toISOString().slice(0, 10);
          const b = buckets.get(key);
          if (b) {
            if (outgoing) b.spentKobo  += tx.amount;
            else          b.incomeKobo += tx.amount;
          }
        }
      }
      for (const sv of services) {
        if (sv.status !== 'completed') continue;
        const d = new Date(sv.createdAt);
        if (d >= monthStart) spd += sv.amount;
        if (d >= weekStart) {
          const key = d.toISOString().slice(0, 10);
          const b = buckets.get(key);
          if (b) b.spentKobo += sv.amount;
        }
      }

      setIncome(inc);
      setSpent(spd);
      setSpark([...buckets.values()]);
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  // Active savings goals
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGoalsLoading(true);
    listGoals({ status: 'active' })
      .then((g) => setGoals(Array.isArray(g) ? g.slice(0, 10) : []))
      .catch(() => setGoals([]))
      .finally(() => setGoalsLoading(false));
  }, []);

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <Header />
        <BalanceCard
          balance={account?.balance ?? 0}
          accountNumber={account?.accountNumber ?? ''}
          loading={acctLoading}
        />
        {acctError && <InlineError message={acctError} />}

        <QuickActions />

        <FinancialSummary incomeKobo={income} spentKobo={spent} sparkline={spark} />

        <GoalsStrip goals={goals} loading={goalsLoading} />

        <TransactionHistory />
      </div>
    </>
  );
}
