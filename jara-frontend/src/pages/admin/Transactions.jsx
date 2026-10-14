import { useEffect, useState } from 'react';
import { Send, Landmark, Phone, Wifi, Receipt } from 'lucide-react';
import { listAdminTransfers, listAdminServices } from '../../services/admin';
import { formatNaira } from '../../utils/format';
import styles from './Transactions.module.css';

const TABS = [
  { id: 'transfers', label: 'Transfers' },
  { id: 'services',  label: 'Bill Payments' },
];

const TYPE_OPTIONS = {
  transfers: [
    { id: '',     label: 'All types' },
    { id: 'jara', label: 'Jara → Jara' },
    { id: 'bank', label: 'Bank' },
  ],
  services: [
    { id: '',        label: 'All types' },
    { id: 'airtime', label: 'Airtime' },
    { id: 'data',    label: 'Data' },
  ],
};

const STATUSES = [
  { id: '',          label: 'Any status' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending',   label: 'Pending' },
  { id: 'failed',    label: 'Failed' },
];

export default function AdminTransactions() {
  const [tab, setTab] = useState('transfers');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Reset type when switching tabs to avoid stale filter combos.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setType(''); }, [tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    const fetcher = tab === 'transfers' ? listAdminTransfers : listAdminServices;
    fetcher({ type: type || undefined, status: status || undefined, limit: 25 })
      .then((res) => {
        setRows(tab === 'transfers' ? res.transfers : res.transactions);
        setCursor(res.nextCursor);
      })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [tab, type, status]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const fetcher = tab === 'transfers' ? listAdminTransfers : listAdminServices;
      const res = await fetcher({
        type: type || undefined,
        status: status || undefined,
        limit: 25,
        cursor,
      });
      const nextRows = tab === 'transfers' ? res.transfers : res.transactions;
      setRows((list) => [...list, ...nextRows]);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Transactions</h1>
        <p className={styles.subtitle}>Cross-user transfer + bill-payment ledger.</p>
      </header>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.filters}>
        <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_OPTIONS[tab].map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className={styles.status}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.status}>Nothing matches those filters.</p>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            {tab === 'transfers' ? <TransfersTable rows={rows} /> : <ServicesTable rows={rows} />}
          </div>
          <footer className={styles.footer}>
            <span className={styles.footerText}>
              Showing {rows.length} {tab === 'transfers' ? 'transfers' : 'purchases'}
              {cursor ? ' · more available' : ''}
            </span>
            {cursor && (
              <button
                type="button"
                className={styles.loadMore}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}

function TransfersTable({ rows }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>When</th>
          <th>Type</th>
          <th>Recipient</th>
          <th className={styles.right}>Amount</th>
          <th>Status</th>
          <th>Reference</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const Icon = r.type === 'bank' ? Landmark : Send;
          const recipient = r.type === 'bank'
            ? `${r.toBank?.accountName || '—'} · ${r.toBank?.bankName || ''}`
            : 'Another Jara account';
          return (
            <tr key={r._id}>
              <td>
                <div className={styles.when}>
                  {new Date(r.createdAt).toLocaleDateString('en-GB')}
                  <span className={styles.whenTime}>
                    {new Date(r.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.typePill}>
                  <Icon size={12} /> {r.type === 'bank' ? 'Bank' : 'Jara'}
                </span>
              </td>
              <td className={styles.recipient}>{recipient}</td>
              <td className={`${styles.right} ${styles.amount}`}>{formatNaira(r.amount / 100)}</td>
              <td><StatusPill status={r.status} /></td>
              <td className={styles.ref}>{r.reference}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function ServicesTable({ rows }) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>When</th>
          <th>Type</th>
          <th>Provider</th>
          <th>Recipient</th>
          <th className={styles.right}>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const Icon = r.type === 'airtime' ? Phone : r.type === 'data' ? Wifi : Receipt;
          return (
            <tr key={r._id}>
              <td>
                <div className={styles.when}>
                  {new Date(r.createdAt).toLocaleDateString('en-GB')}
                  <span className={styles.whenTime}>
                    {new Date(r.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </td>
              <td>
                <span className={styles.typePill}>
                  <Icon size={12} /> {r.type}
                </span>
              </td>
              <td className={styles.recipient}>{r.provider?.toUpperCase()}</td>
              <td className={styles.recipient}>{r.recipient}</td>
              <td className={`${styles.right} ${styles.amount}`}>{formatNaira(r.amount / 100)}</td>
              <td><StatusPill status={r.status} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`${styles.status_pill} ${styles[`status_${status}`] || ''}`}>{status}</span>
  );
}
