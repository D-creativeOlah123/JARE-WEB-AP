import { useEffect, useState } from 'react';
import { listAdminGoals } from '../../services/admin';
import { formatNaira } from '../../utils/format';
import styles from './DirectoryTable.module.css';

const STATUSES = [
  { id: '',          label: 'All' },
  { id: 'active',    label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function AdminGoals() {
  const [status, setStatus] = useState('');
  const [goals, setGoals] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    listAdminGoals({ status: status || undefined, limit: 25 })
      .then((res) => { setGoals(res.goals); setCursor(res.nextCursor); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [status]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listAdminGoals({ status: status || undefined, limit: 25, cursor });
      setGoals((list) => [...list, ...res.goals]);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load more');
    } finally { setLoadingMore(false); }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Goals</h1>
        <p className={styles.subtitle}>Every savings goal across the platform.</p>
      </header>

      <div className={styles.filters}>
        {STATUSES.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            className={`${styles.filter} ${status === f.id ? styles.filterActive : ''}`}
            onClick={() => setStatus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className={styles.status}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : goals.length === 0 ? (
        <p className={styles.status}>No goals match that filter.</p>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th className={styles.right}>Saved</th>
                  <th className={styles.right}>Target</th>
                  <th>Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {goals.map((g) => {
                  const pct = g.targetAmount > 0
                    ? Math.max(0, Math.min(100, (g.savedAmount / g.targetAmount) * 100))
                    : 0;
                  return (
                    <tr key={g._id}>
                      <td className={styles.strong}>{g.name}</td>
                      <td>
                        <div className={styles.ownerCell}>
                          <span>{g.owner?.fullName || 'Unknown'}</span>
                          <span className={styles.dim}>{g.owner?.email || '—'}</span>
                        </div>
                      </td>
                      <td className={styles.dim}>{g.category || '—'}</td>
                      <td className={styles.right}>{formatNaira(g.savedAmount / 100)}</td>
                      <td className={styles.right}>{formatNaira(g.targetAmount / 100)}</td>
                      <td>
                        <div className={styles.track}>
                          <div className={styles.fill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={styles.pct}>{Math.round(pct)}%</span>
                      </td>
                      <td><StatusPill status={g.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <footer className={styles.footer}>
            <span className={styles.footerText}>
              Showing {goals.length} goal{goals.length !== 1 ? 's' : ''}
              {cursor ? ' · more available' : ''}
            </span>
            {cursor && (
              <button type="button" className={styles.loadMore} onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`${styles.status_pill} ${styles[`status_${status}`] || ''}`}>{status}</span>;
}
