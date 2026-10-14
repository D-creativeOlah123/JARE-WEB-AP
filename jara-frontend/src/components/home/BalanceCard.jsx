import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Copy, Plus, Send } from 'lucide-react';
import { formatNaira } from '../../utils/format';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../hooks/useToast';
import Skeleton from '../Skeleton';
import styles from './BalanceCard.module.css';

/**
 * BalanceCard — plum gradient wallet card at the top of the Home screen.
 *
 *   - Balance CountUp runs once per session (sessionStorage key
 *     `jara.balanceAnimated`) so it doesn't scramble on every nav.
 *   - Eye toggle masks the balance ("₦••••••").
 *   - Account number is one-tap copyable (clipboard + success toast).
 *   - Add money / Send CTAs for the two most common actions.
 *   - Loading state is a shimmer skeleton over the amount + account number.
 */
const SESSION_KEY = 'jara.balanceAnimated';

export default function BalanceCard({ balance = 0, accountNumber = '', loading = false }) {
  const toast = useToast();
  const [hidden, setHidden] = useState(false);

  // Already animated in this tab? Then jump straight to the final value.
  // Read sessionStorage once on first render via a lazy useState initializer.
  const [animatedBefore, setAnimatedBefore] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  });

  const value = useCountUp({
    to: balance,
    duration: 900,
    enabled: !loading && !animatedBefore,
  });

  // Persist the "already animated" flag after a successful first run.
  useEffect(() => {
    if (loading || animatedBefore) return;
    if (value === balance) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* private */ }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimatedBefore(true);
    }
  }, [value, balance, loading, animatedBefore]);

  const display = hidden ? '₦••••••' : formatNaira(value / 100, { decimals: 2 });

  async function handleCopy() {
    if (!accountNumber) return;
    try {
      await navigator.clipboard.writeText(accountNumber);
      toast.success('Copied', 'Account number is on your clipboard.');
    } catch {
      toast.error('Could not copy', 'Select and copy it manually.');
    }
  }

  return (
    <section className={`${styles.card} animate-fadeSlide`} aria-label="Wallet balance">
      {/* Procedural noise — same treatment as MiniJaraCard */}
      <svg className={styles.noise} xmlns="http://www.w3.org/2000/svg"
        width="100%" height="100%" viewBox="0 0 240 150"
        preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="bc-noise">
            <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#bc-noise)" />
      </svg>

      <header className={styles.topRow}>
        <span className={styles.label}>Wallet balance</span>
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setHidden((h) => !h)}
          aria-label={hidden ? 'Show balance' : 'Hide balance'}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </header>

      <div className={styles.balanceRow}>
        {loading
          ? <Skeleton width={180} height={32} radius={8}
              style={{ background: 'rgba(255,255,255,0.25)' }} />
          : <span className={styles.amount}>{display}</span>}
      </div>

      <div className={styles.acctRow}>
        <span className={styles.acctLabel}>Jara account</span>
        {loading
          ? <Skeleton width={120} height={14} radius={4}
              style={{ background: 'rgba(255,255,255,0.25)' }} />
          : (
            <button
              type="button"
              className={styles.acctButton}
              onClick={handleCopy}
              aria-label={`Copy account number ${accountNumber}`}
            >
              <span className={styles.acctValue}>{accountNumber || '—'}</span>
              <Copy size={13} />
            </button>
          )}
      </div>

      <div className={styles.actions}>
        <Link to="/transfer" className={`${styles.actionBtn} ${styles.actionPrimary} btn-lift`}>
          <Send size={14} />
          Send
        </Link>
        <Link to="/transfer" className={`${styles.actionBtn} ${styles.actionSecondary} btn-lift`}>
          <Plus size={14} />
          Add money
        </Link>
      </div>
    </section>
  );
}
