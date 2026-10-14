import { useEffect, useState } from 'react';
import { AlertOctagon, Clock, Send, Receipt } from 'lucide-react';
import { getAdminModeration } from '../../services/admin';
import { formatNaira } from '../../utils/format';
import styles from './Notifications.module.css';

/**
 * Admin moderation queue — a single reverse-chronological feed of items
 * that need human attention: failed transfers/services and pending items
 * older than 30 minutes.
 */
export default function AdminNotifications() {
  const [data, setData] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    try {
      setData(await getAdminModeration({ limit: 100 }));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load queue');
    } finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const { items, summary } = data;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>Moderation Queue</h1>
          <p className={styles.subtitle}>Failed and long-pending items across the system.</p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={refresh}>Refresh</button>
      </header>

      <section className={styles.summaryRow}>
        <SummaryTile label="Failed transfers"  value={summary.failedTransfers ?? 0} tone="danger" />
        <SummaryTile label="Failed services"   value={summary.failedServices  ?? 0} tone="danger" />
        <SummaryTile label="Stalled transfers" value={summary.staleTransfers  ?? 0} tone="warn" />
        <SummaryTile label="Stalled services"  value={summary.staleServices   ?? 0} tone="warn" />
      </section>

      {loading ? (
        <p className={styles.status}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyBadge}>✓</div>
          <p className={styles.emptyTitle}>All clear</p>
          <p className={styles.emptySub}>No failed or stalled transactions right now.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((row) => {
            const KindIcon = row.kind === 'transfer' ? Send : Receipt;
            const SeverityIcon = row.severity === 'failed' ? AlertOctagon : Clock;
            return (
              <li key={row.id} className={`${styles.row} ${styles[`row_${row.severity}`]}`}>
                <div className={`${styles.icon} ${styles[`icon_${row.severity}`]}`}>
                  <SeverityIcon size={16} />
                </div>
                <div className={styles.text}>
                  <div className={styles.rowTitle}>
                    <KindIcon size={12} />
                    {row.title}
                  </div>
                  <div className={styles.rowBody}>{row.body}</div>
                  <div className={styles.rowMeta}>
                    <span>{new Date(row.createdAt).toLocaleString()}</span>
                    <span>·</span>
                    <span className={styles.ref}>{row.reference}</span>
                    <span>·</span>
                    <span className={styles.amount}>{formatNaira(row.amount / 100)}</span>
                  </div>
                </div>
                <span className={`${styles.severityPill} ${styles[`pill_${row.severity}`]}`}>
                  {row.severity}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  return (
    <div className={`${styles.tile} ${styles[`tile_${tone}`]}`}>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileLabel}>{label}</span>
    </div>
  );
}
