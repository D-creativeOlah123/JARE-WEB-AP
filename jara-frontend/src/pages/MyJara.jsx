import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, UserPlus, LineChart } from 'lucide-react';
import { listGoals } from '../services/goals';
import { listGroups } from '../services/groups';
import { formatNaira } from '../utils/format';
import styles from './MyJara.module.css';

export default function MyJara() {
  const [tab, setTab] = useState('personal');
  const [goals, setGoals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([listGoals(), listGroups()])
      .then(([gs, grs]) => { setGoals(gs); setGroups(grs); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const totalSaved = useMemo(() => {
    const goalSum = goals.reduce((s, g) => s + (g.savedAmount || 0), 0);
    const groupSum = groups.reduce((s, g) => s + (g.savedAmount || 0), 0);
    return goalSum + groupSum;
  }, [goals, groups]);

  const personalGoals = goals.filter((g) => !g.groupId);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>My Jara</h1>
        <p className={styles.subtitle}>Your savings, your way.</p>
      </header>

      <section className={styles.summary}>
        <span className={styles.summaryLabel}>Savings</span>
        <span className={styles.summaryValue}>{formatNaira(totalSaved / 100, { decimals: 2 })}</span>
      </section>

      <div className={styles.tabs}>
        <button type="button"
          className={`${styles.tab} ${tab === 'personal' ? styles.tabActive : ''}`}
          onClick={() => setTab('personal')}>
          Personal
        </button>
        <button type="button"
          className={`${styles.tab} ${tab === 'group' ? styles.tabActive : ''}`}
          onClick={() => setTab('group')}>
          Group
        </button>
      </div>

      <section className={styles.listSection}>
        <h2 className={styles.listHeading}>
          {tab === 'personal' ? 'Savings Goals' : "Groups I'm in"}
        </h2>

        {loading ? (
          <p className={styles.status}>Loading…</p>
        ) : error ? (
          <p className={styles.errorBanner}>{error}</p>
        ) : tab === 'personal' ? (
          personalGoals.length === 0 ? (
            <p className={styles.empty}>You haven't created any goals yet.</p>
          ) : (
            personalGoals.map((g) => {
              const pct = Math.max(0, Math.min(100, (g.savedAmount / g.targetAmount) * 100));
              return (
                <Link key={g._id} to={`/my-jara/${g._id}`} className={styles.goalCard}>
                  <div className={styles.goalHead}>
                    <span className={styles.goalName}>
                      {g.name}
                      {g.status === 'completed' && <span className={styles.badgeDone}>Completed</span>}
                    </span>
                    <span className={styles.goalPct}>{Math.round(pct)}%</span>
                  </div>
                  <div className={styles.goalSub}>
                    {formatNaira(g.savedAmount / 100)} of {formatNaira(g.targetAmount / 100)}
                  </div>
                  <div className={styles.track}>
                    <div className={styles.fill} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })
          )
        ) : groups.length === 0 ? (
          <p className={styles.empty}>You're not in any groups yet.</p>
        ) : (
          groups.map((g) => {
            const pct = Math.max(0, Math.min(100, (g.savedAmount / g.targetAmount) * 100));
            return (
              <Link key={g._id} to={`/groups/${g._id}`} className={styles.goalCard}>
                <div className={styles.goalHead}>
                  <span className={styles.goalName}>
                    {g.name}
                    {g.status === 'completed' && <span className={styles.badgeDone}>Completed</span>}
                  </span>
                  <span className={styles.goalPct}>{Math.round(pct)}%</span>
                </div>
                <div className={styles.goalSub}>
                  {formatNaira(g.savedAmount / 100)} of {formatNaira(g.targetAmount / 100)} · {g.members?.length || 0} members
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })
        )}
      </section>

      {/* 3 pill buttons matching the mockup */}
      <div className={styles.actions}>
        <Link to={tab === 'group' ? '/groups/new' : '/my-jara/new'} className={styles.actionBtn}>
          <div className={styles.actionIcon}><Plus size={18} /></div>
          <span className={styles.actionLabel}>{tab === 'group' ? 'Create Group' : 'Create Goal'}</span>
        </Link>
        <Link to="/groups/join" className={styles.actionBtn}>
          <div className={styles.actionIcon}><UserPlus size={18} /></div>
          <span className={styles.actionLabel}>Join Group</span>
        </Link>
        <Link to="/reports" className={styles.actionBtn}>
          <div className={styles.actionIcon}><LineChart size={18} /></div>
          <span className={styles.actionLabel}>View Progress</span>
        </Link>
      </div>
    </div>
  );
}
