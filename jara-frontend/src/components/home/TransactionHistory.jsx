import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Landmark } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listTransfers } from '../../services/transfers';
import { listServiceHistory } from '../../services/serviceTx';
import ListRow from '../ui/ListRow';
import ProviderMark from '../ui/ProviderMark';
import StatusPill from '../ui/StatusPill';
import Skeleton from '../Skeleton';
import { InlineError } from '../states/ErrorState';
import EmptyState from '../states/EmptyState';
import { appImages } from '../../data/appImages';
import styles from './TransactionHistory.module.css';

/**
 * TransactionHistory — up to 5 of the user's most recent ledger rows,
 * grouped by day ("Today", "Yesterday", "Mon 6 Oct").
 *
 *   - Each row uses `ListRow` with a leading mark (ProviderMark for bills,
 *     Landmark icon for bank transfers, initials for Jara transfers).
 *   - Pending / failed rows carry a `StatusPill`.
 *   - Partial failure: when either source fetch fails, we still render the
 *     other and show an InlineError on top; a full failure shows an error
 *     card.
 *   - Empty → photo-based EmptyState via `appImages.emptyFirstTx`.
 */

export default function TransactionHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors]   = useState({ transfers: '', services: '' });

  async function refresh() {
    setLoading(true);
    setErrors({ transfers: '', services: '' });
    const [t, s] = await Promise.allSettled([
      listTransfers({ limit: 10 }),
      listServiceHistory(),
    ]);
    const transfers = t.status === 'fulfilled' ? t.value : [];
    const services  = s.status === 'fulfilled' ? s.value : [];
    setErrors({
      transfers: t.status === 'rejected' ? friendly(t.reason) : '',
      services:  s.status === 'rejected' ? friendly(s.reason) : '',
    });
    setItems(normalise({ transfers, services }, user?.id));
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const bothFailed = errors.transfers && errors.services;
  const partialErr = bothFailed ? '' : (errors.transfers || errors.services);

  return (
    <section className={styles.card}>
      <header className={styles.head}>
        <h3 className={styles.title}>Transaction history</h3>
        <Link to="/transactions" className={styles.viewAll}>
          View all <ChevronRight size={13} />
        </Link>
      </header>

      {partialErr && <InlineError message={partialErr} onRetry={refresh} />}

      {loading ? (
        <ul className={styles.list} aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className={styles.skeletonRow}>
              <Skeleton width={34} height={34} radius="50%" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton width="55%" height={12} />
                <Skeleton width="35%" height={10} />
              </div>
              <Skeleton width={70} height={14} />
            </li>
          ))}
        </ul>
      ) : bothFailed ? (
        <InlineError
          message={errors.transfers || errors.services || 'Could not load activity.'}
          onRetry={refresh}
        />
      ) : items.length === 0 ? (
        <EmptyState
          image={appImages.emptyFirstTx}
          title="No activity yet"
          body="Your transfers and bill payments will appear here."
          cta={{ label: 'Make your first transfer', to: '/transfer' }}
          className={styles.empty}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((tx) => (
            <li key={tx.id} className={styles.row}>
              <ListRow
                leading={leadingFor(tx)}
                title={tx.title}
                subtitle={subtitleFor(tx)}
                amountKobo={tx.amountKobo}
                chevron={false}
                trailing={tx.status !== 'completed' ? <StatusPill status={tx.status} /> : undefined}
                className={styles.listRow}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- helpers ---------- */

function friendly(err) {
  return err?.response?.data?.error?.message
      || err?.message
      || 'Could not load';
}

function leadingFor(tx) {
  if (tx.kind === 'transfer') {
    if (tx.type === 'bank')  return <span className={styles.markWrap}><Landmark size={16} /></span>;
    return <span className={styles.markInitials}>{tx.initials}</span>;
  }
  return <ProviderMark name={tx.provider} labelHidden />;
}

function subtitleFor(tx) {
  const time = new Date(tx.createdAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  if (tx.kind === 'transfer') return `${tx.subtitle} · ${time}`;
  return `${(tx.provider || '').toString()} · ${time}`;
}

function initialsFromName(name) {
  if (!name) return 'JR';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function normalise({ transfers, services }, meId) {
  const rows = [];
  for (const t of transfers) {
    const outgoing = String(t.fromUserId) === String(meId);
    const otherName = t.type === 'bank'
      ? (t.toBank?.accountName || 'Bank transfer')
      : (outgoing ? 'Jara transfer' : 'Received on Jara');
    rows.push({
      id: `t_${t._id}`,
      kind: 'transfer',
      type: t.type,
      title: outgoing ? `Sent to ${otherName}` : `From ${otherName}`,
      subtitle: t.type === 'bank' ? (t.toBank?.bankName || 'Bank') : 'Jara',
      amountKobo: outgoing ? -t.amount : t.amount,
      status: t.status,
      createdAt: t.createdAt,
      initials: initialsFromName(otherName),
    });
  }
  for (const s of services) {
    const providerName =
      s.type === 'airtime' || s.type === 'data'
        ? (s.provider || '').toUpperCase()
        : s.provider;
    rows.push({
      id: `s_${s._id}`,
      kind: 'service',
      type: s.type,
      provider: providerName,
      title: titleForService(s),
      amountKobo: -s.amount,
      status: s.status,
      createdAt: s.createdAt,
    });
  }
  return rows
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
}

function titleForService(s) {
  if (s.type === 'airtime')     return `${(s.provider || '').toUpperCase()} airtime`;
  if (s.type === 'data')        return `${(s.provider || '').toUpperCase()} data`;
  if (s.type === 'electricity') return `Electricity · ${s.provider || ''}`;
  if (s.type === 'cable')       return `TV · ${s.provider || ''}`;
  if (s.type === 'education')   return `${(s.provider || '').toUpperCase()} PIN`;
  return 'Payment';
}
