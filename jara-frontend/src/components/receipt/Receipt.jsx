import { Copy, Share2, Printer, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNaira } from '../../utils/format';
import StatusPill from '../ui/StatusPill';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import styles from './Receipt.module.css';

/**
 * Receipt — a Nigerian e-receipt. Prints cleanly to PDF via
 * `window.print()` + `@media print` in Receipt.module.css (only the
 * `.printable` wrapper is painted on paper).
 *
 * Accepts a normalised transaction object:
 *   {
 *     id, kind: 'transfer' | 'service',
 *     reference, status, createdAt,
 *     direction: 'debit' | 'credit',
 *     amountKobo,        // signed
 *     type,              // 'jara' | 'bank' | 'airtime' | 'data' | …
 *     sender?: string, recipient?: string, provider?: string, bank?: string,
 *     remark?, feeKobo?, token?, sessionId?,
 *   }
 */
export default function Receipt({ tx, onReportIssue }) {
  const toast = useToast();
  if (!tx) return null;

  const amount = formatNaira(Math.abs(tx.amountKobo) / 100, { decimals: 2 });
  const sign   = tx.direction === 'credit' ? '+' : '−';

  async function copyRef() {
    try {
      await navigator.clipboard.writeText(tx.reference);
      toast.success('Copied', `Reference ${tx.reference} is on your clipboard.`);
    } catch {
      toast.error('Could not copy', 'Select and copy the reference manually.');
    }
  }

  async function share() {
    const text = `Jara receipt ${tx.reference} · ${sign}${amount} · ${tx.status}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Jara receipt', text });
      else { await navigator.clipboard.writeText(text); toast.info('Copied to share', text); }
    } catch { /* user cancelled */ }
  }

  function print() {
    document.body.classList.add('jara-print-receipt');
    const after = () => {
      document.body.classList.remove('jara-print-receipt');
      window.removeEventListener('afterprint', after);
    };
    window.addEventListener('afterprint', after);
    window.print();
  }

  return (
    <article className={`${styles.wrap} printable`} aria-label="Transaction receipt">
      <header className={styles.head}>
        <div className={styles.medallion} aria-hidden="true">
          <span>J</span>
        </div>
        <h2 className={styles.title}>Transaction receipt</h2>
        <StatusPill status={tx.status} className={styles.statusPill} />
      </header>

      <div className={styles.amountBlock}>
        <span className={styles.amountLabel}>
          {tx.direction === 'credit' ? 'Received' : 'Sent'}
        </span>
        <span className={`${styles.amount} ${tx.direction === 'credit' ? styles.credit : styles.debit}`}>
          {sign}{amount}
        </span>
      </div>

      <dl className={styles.rows}>
        <Row label="Reference"   value={tx.reference}  mono />
        <Row label="Date (WAT)"  value={new Date(tx.createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })} />
        <Row label="Type"        value={prettyType(tx)} />
        {tx.sender    && <Row label="From"      value={tx.sender} />}
        {tx.recipient && <Row label="To"        value={tx.recipient} />}
        {tx.bank      && <Row label="Bank"      value={tx.bank} />}
        {tx.provider  && <Row label="Provider"  value={tx.provider} />}
        {tx.remark    && <Row label="Remark"    value={tx.remark} />}
        {Number.isFinite(tx.feeKobo) && (
          <Row label="Fee" value={formatNaira(tx.feeKobo / 100, { decimals: 2 })} />
        )}
        {tx.token     && <Row label="Token"     value={tx.token} mono big />}
        {tx.sessionId && <Row label="Session ID" value={tx.sessionId} mono />}
      </dl>

      <div className={styles.divider} aria-hidden="true" />

      <footer className={styles.foot}>
        Jara · support@jara.ng · TODO(confirm)
      </footer>

      {/* Actions are hidden on print via Receipt.module.css */}
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" iconLeft={Copy} onClick={copyRef}>
          Copy reference
        </Button>
        <Button size="sm" variant="ghost" iconLeft={Share2} onClick={share}>
          Share
        </Button>
        <Button size="sm" variant="ghost" iconLeft={Printer} onClick={print}>
          Download PDF
        </Button>
        {onReportIssue ? (
          <Button size="sm" variant="ghost" iconLeft={Flag} onClick={onReportIssue}>
            Report an issue
          </Button>
        ) : (
          <Link
            to={`/profile/support?ref=${encodeURIComponent(tx.reference)}`}
            className={styles.reportLink}
          >
            <Flag size={14} /> Report an issue
          </Link>
        )}
      </div>
    </article>
  );
}

function Row({ label, value, mono = false, big = false }) {
  return (
    <div className={styles.row}>
      <dt className={styles.dt}>{label}</dt>
      <dd className={`${styles.dd} ${mono ? styles.mono : ''} ${big ? styles.big : ''}`}>
        {value}
      </dd>
    </div>
  );
}

function prettyType(tx) {
  if (tx.kind === 'service') return `${tx.type?.replace(/^./, (c) => c.toUpperCase())} payment`;
  return tx.type === 'bank' ? 'Bank transfer' : 'Jara transfer';
}
