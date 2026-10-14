import { useEffect, useMemo, useState } from 'react';
import { Download, Landmark, Search as SearchIcon } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import ListRow from '../components/ui/ListRow';
import ProviderMark from '../components/ui/ProviderMark';
import StatusPill from '../components/ui/StatusPill';
import Chip from '../components/ui/Chip';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Skeleton from '../components/Skeleton';
import ReceiptSheet from '../components/receipt/ReceiptSheet';
import EmptyState from '../components/states/EmptyState';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import { listTransfers } from '../services/transfers';
import { listServiceHistory } from '../services/serviceTx';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { appImages } from '../data/appImages';
import styles from './Transactions.module.css';

/**
 * Transactions — the full ledger with filters, search, infinite paging,
 * CSV export, and a Receipt drawer per row.
 *
 *   - Sticky filter bar: All / Transfers / Bills / Savings · status chip.
 *   - Debounced search by name / reference (client-side on the loaded set).
 *   - Infinite scroll of 30 rows at a time (manual "Load more" fallback).
 *   - Grouped by day ("Today", "Yesterday", "Mon 6 Oct").
 *   - Tapping a row opens the receipt in a bottom Sheet.
 */

const FILTERS = [
  { id: 'all',       label: 'All' },
  { id: 'transfers', label: 'Transfers' },
  { id: 'bills',     label: 'Bills' },
  { id: 'savings',   label: 'Savings' },
];
const PAGE_SIZE = 30;

export default function Transactions() {
  const { user } = useAuth();
  const toast = useToast();

  const [transfers, setTransfers] = useState([]);
  const [services,  setServices]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const [kind,   setKind]   = useState('all');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [limit,  setLimit]  = useState(PAGE_SIZE);
  const [sheetTx, setSheetTx] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim().toLowerCase()), 180);
    return () => clearTimeout(id);
  }, [search]);

  async function refresh() {
    setLoading(true); setError('');
    const [t, s] = await Promise.allSettled([
      listTransfers({ limit: 200 }),
      listServiceHistory(),
    ]);
    if (t.status === 'rejected' && s.status === 'rejected') {
      setError('Could not load transactions. Please try again.');
    } else {
      setError(
        t.status === 'rejected' ? 'Some transfers could not be loaded.'
      : s.status === 'rejected' ? 'Some bill payments could not be loaded.'
      : '',
      );
    }
    setTransfers(t.status === 'fulfilled' ? t.value : []);
    setServices (s.status === 'fulfilled' ? s.value : []);
    setLoading(false);
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  // Normalise once; filtering/searching is cheap client-side on top.
  const all = useMemo(
    () => normalise({ transfers, services }, user?.id),
    [transfers, services, user?.id],
  );

  const filtered = useMemo(() => {
    const haystack = (r) =>
      (r.title + ' ' + (r.subtitle || '') + ' ' + r.reference).toLowerCase();
    return all.filter((r) => {
      if (kind === 'transfers' && r.kind !== 'transfer') return false;
      if (kind === 'bills'     && r.kind !== 'service')  return false;
      if (kind === 'savings'   && r.kind !== 'contribution') return false;
      if (status && r.status !== status) return false;
      if (debounced && !haystack(r).includes(debounced)) return false;
      return true;
    });
  }, [all, kind, status, debounced]);

  const page    = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;
  const groups  = useMemo(() => groupByDay(page), [page]);

  function exportCsv() {
    if (!filtered.length) { toast.info('Nothing to export', 'No transactions match your filters.'); return; }
    const header = ['date', 'reference', 'type', 'title', 'status', 'amount_naira'].join(',');
    const rows = filtered.map((r) => [
      new Date(r.createdAt).toISOString(),
      r.reference,
      r.type || r.kind,
      JSON.stringify(r.title),
      r.status,
      (r.amountKobo / 100).toFixed(2),
    ].join(','));
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jara-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success('Export ready', `${filtered.length} row${filtered.length === 1 ? '' : 's'} downloaded.`);
  }

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <MobileHeader title="Transactions" to="/dashboard" />

        {/* Sticky filter bar */}
        <div className={styles.filterBar}>
          <Input
            label=""
            iconLeft={SearchIcon}
            placeholder="Search by name or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />
          <div className={styles.chips}>
            {FILTERS.map((f) => (
              <Chip key={f.id} variant="brand"
                selected={kind === f.id}
                onSelect={() => { setKind(f.id); setLimit(PAGE_SIZE); }}>
                {f.label}
              </Chip>
            ))}
          </div>
          <div className={styles.chips}>
            {['', 'completed', 'pending', 'failed'].map((s) => (
              <Chip
                key={s || 'all'}
                variant={s ? statusChipVariant(s) : 'brand'}
                selected={status === s}
                onSelect={() => { setStatus(s); setLimit(PAGE_SIZE); }}
              >
                {s ? s[0].toUpperCase() + s.slice(1) : 'Any status'}
              </Chip>
            ))}
            <Button
              size="sm"
              variant="ghost"
              iconLeft={Download}
              onClick={exportCsv}
              className={styles.exportBtn}
            >
              CSV
            </Button>
          </div>
        </div>

        {error && <InlineError message={error} onRetry={refresh} />}

        {loading ? (
          <ul className={styles.list} aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className={styles.skeletonRow}>
                <Skeleton width={34} height={34} radius="50%" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton width="60%" height={12} />
                  <Skeleton width="40%" height={10} />
                </div>
                <Skeleton width={72} height={14} />
              </li>
            ))}
          </ul>
        ) : groups.length === 0 ? (
          <EmptyState
            image={appImages.emptyFirstTx}
            title={debounced ? 'No matches' : 'No transactions yet'}
            body={debounced
              ? 'Try different words or clear the filters.'
              : 'Your transfers and bill payments will appear here.'}
            cta={debounced
              ? { label: 'Clear filters', onClick: () => { setSearch(''); setKind('all'); setStatus(''); } }
              : { label: 'Make your first transfer', to: '/transfer' }}
          />
        ) : (
          <>
            {groups.map(([day, rows]) => (
              <section key={day} className={styles.dayGroup}>
                <h3 className={styles.dayLabel}>{dayLabel(day)}</h3>
                <ul className={styles.list}>
                  {rows.map((r) => (
                    <li key={r.id}>
                      <ListRow
                        leading={leadingFor(r)}
                        title={r.title}
                        subtitle={subtitleFor(r)}
                        amountKobo={r.amountKobo}
                        chevron={false}
                        trailing={r.status !== 'completed' ? <StatusPill status={r.status} /> : undefined}
                        onClick={() => setSheetTx(r)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {hasMore && (
              <div className={styles.loadMore}>
                <Button variant="ghost" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}

        <ReceiptSheet
          open={Boolean(sheetTx)}
          onClose={() => setSheetTx(null)}
          tx={sheetTx}
        />
      </div>
    </>
  );
}

/* ---------- helpers ---------- */

function statusChipVariant(s) {
  if (s === 'completed') return 'success';
  if (s === 'pending')   return 'warning';
  if (s === 'failed')    return 'danger';
  return 'brand';
}

function groupByDay(rows) {
  const g = new Map();
  for (const r of rows) {
    const k = new Date(r.createdAt).toISOString().slice(0, 10);
    if (!g.has(k)) g.set(k, []);
    g.get(k).push(r);
  }
  return [...g.entries()];
}

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
}

function leadingFor(r) {
  if (r.kind === 'transfer') {
    if (r.type === 'bank') {
      return <span className={styles.landmark}><Landmark size={16} /></span>;
    }
    return <span className={styles.initials}>{r.initials}</span>;
  }
  return <ProviderMark name={r.provider} labelHidden />;
}

function subtitleFor(r) {
  const time = new Date(r.createdAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  return `${r.subtitle || ''} · ${time} · ${r.reference}`;
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
      reference: t.reference,
      title: outgoing ? `Sent to ${otherName}` : `From ${otherName}`,
      subtitle: t.type === 'bank' ? (t.toBank?.bankName || 'Bank') : 'Jara',
      amountKobo: outgoing ? -t.amount : t.amount,
      direction: outgoing ? 'debit' : 'credit',
      status: t.status,
      createdAt: t.createdAt,
      initials: initialsFromName(otherName),
      // Receipt bits
      sender:    outgoing ? 'You' : otherName,
      recipient: outgoing ? otherName : 'You',
      bank:      t.toBank?.bankName,
      remark:    t.remark,
      feeKobo:   t.feeKobo,
      sessionId: t.sessionId,
    });
  }
  for (const s of services) {
    const providerName =
      (s.type === 'airtime' || s.type === 'data') ? (s.provider || '').toUpperCase() : s.provider;
    rows.push({
      id: `s_${s._id}`,
      kind: 'service',
      type: s.type,
      provider: providerName,
      reference: s.reference,
      title: titleForService(s),
      subtitle: providerName,
      amountKobo: -s.amount,
      direction: 'debit',
      status: s.status,
      createdAt: s.createdAt,
      token: s.token,
    });
  }
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function titleForService(s) {
  if (s.type === 'airtime')     return `${(s.provider || '').toUpperCase()} airtime`;
  if (s.type === 'data')        return `${(s.provider || '').toUpperCase()} data`;
  if (s.type === 'electricity') return `Electricity · ${s.provider || ''}`;
  if (s.type === 'cable')       return `TV · ${s.provider || ''}`;
  if (s.type === 'education')   return `${(s.provider || '').toUpperCase()} PIN`;
  return 'Payment';
}

