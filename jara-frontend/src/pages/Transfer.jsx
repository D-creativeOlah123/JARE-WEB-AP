import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trash2, Wallet, Zap } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import Avatar from '../components/ui/Avatar';
import BankMark from '../components/ui/BankMark';
import Skeleton from '../components/Skeleton';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import EmptyState from '../components/states/EmptyState';
import Img from '../components/landing/ui/Img';
import { appImages } from '../data/appImages';
import { getMyAccount, devSeedBalance } from '../services/accounts';
import { listBeneficiaries, deleteBeneficiary } from '../services/beneficiaries';
import { formatNaira } from '../utils/format';
import { useToast } from '../hooks/useToast';
import styles from './Transfer.module.css';

/**
 * Transfer — the three-channel hub.
 *
 *   - Two large photo cards for "To Jara" and "To Bank".
 *   - A Withdraw tile (plain) under them.
 *   - Recent beneficiaries row (horizontally scrolling, Avatar + name).
 *   - Full saved-beneficiaries list with delete (optimistic).
 */
export default function Transfer() {
  const toast = useToast();
  const [account, setAccount] = useState(null);
  const [acctLoading, setAcctLoading] = useState(true);
  const [acctError, setAcctError]     = useState('');
  const [benefs, setBenefs] = useState([]);
  const [benefLoading, setBenefLoading] = useState(true);
  const [benefError, setBenefError]     = useState('');
  const [seeding, setSeeding] = useState(false);

  const refresh = useCallback(async () => {
    setAcctLoading(true); setBenefLoading(true);
    setAcctError(''); setBenefError('');
    const [a, b] = await Promise.allSettled([getMyAccount(), listBeneficiaries()]);
    if (a.status === 'fulfilled') setAccount(a.value);
    else setAcctError(friendly(a.reason));
    if (b.status === 'fulfilled') setBenefs(Array.isArray(b.value) ? b.value : []);
    else setBenefError(friendly(b.reason));
    setAcctLoading(false); setBenefLoading(false);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [refresh]);

  async function handleDelete(id, name) {
    // Optimistic: remove immediately; roll back on failure.
    const prev = benefs;
    setBenefs((list) => list.filter((b) => b._id !== id));
    try {
      await deleteBeneficiary(id);
      toast.success('Removed', `${name} is no longer saved.`);
    } catch (err) {
      setBenefs(prev);
      toast.error('Could not remove', friendly(err));
    }
  }

  async function handleDevSeed() {
    setSeeding(true);
    try {
      await devSeedBalance(50_000);
      await refresh();
    } catch (err) {
      toast.error('Seed failed', friendly(err));
    } finally { setSeeding(false); }
  }

  const recents = benefs.slice(0, 6);

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <MobileHeader title="Send money" to="/dashboard" />

        {/* Wallet summary */}
        <section className={`${styles.wallet} animate-fadeSlide`}>
          <div className={styles.walletLeft}>
            <Wallet size={14} />
            <span>Wallet balance</span>
          </div>
          {acctLoading ? (
            <Skeleton width={120} height={18} radius={6}
              style={{ background: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <span className={styles.walletValue}>
              {formatNaira((account?.balance ?? 0) / 100, { decimals: 2 })}
            </span>
          )}
        </section>
        {acctError && <InlineError message={acctError} onRetry={refresh} />}

        {/* Dev seed helper — only visible in DEV builds */}
        {import.meta.env.DEV && account && (
          <div className={styles.dev}>
            <span>Dev: top up ₦50,000 for testing.</span>
            <button type="button" className={styles.devBtn}
              onClick={handleDevSeed} disabled={seeding}>
              <Zap size={12} /> {seeding ? 'Seeding…' : 'Seed'}
            </button>
          </div>
        )}

        {/* Three channels — two photo cards + Withdraw */}
        <section className={styles.channels}>
          <ChannelCard
            to="/transfer/jara"
            title="To Jara"
            subtitle="Instant · free"
            image={appImages.transferHubJara}
          />
          <ChannelCard
            to="/transfer/bank"
            title="To any bank"
            subtitle="₦10 flat · seconds"
            image={appImages.transferHubBank}
          />
          <Link to="/withdraw" className={`${styles.withdrawRow} btn-lift`}>
            <span className={styles.withdrawIcon}><Wallet size={16} /></span>
            <div className={styles.withdrawText}>
              <span className={styles.withdrawTitle}>Withdraw</span>
              <span className={styles.withdrawSub}>Cash out to a linked bank</span>
            </div>
            <ChevronRight size={16} className={styles.chev} />
          </Link>
        </section>

        {/* Recent beneficiaries */}
        <section className={styles.beneficiaries}>
          <header className={styles.beneficiariesHead}>
            <h3 className={styles.beneficiariesTitle}>Recent</h3>
          </header>
          {benefLoading ? (
            <div className={styles.recentTrack} aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.recentCard}>
                  <Skeleton width={44} height={44} radius="50%" />
                  <Skeleton width="70%" height={10} />
                </div>
              ))}
            </div>
          ) : recents.length === 0 ? (
            <p className={styles.recentEmpty}>
              Send to a new recipient and they'll appear here automatically.
            </p>
          ) : (
            <ul className={styles.recentTrack}>
              {recents.map((b) => (
                <li key={b._id} className={styles.recentCard}>
                  <Link to={beneficiaryHref(b)} className={styles.recentLink}>
                    <Avatar name={b.accountName} />
                    <span className={styles.recentName}>
                      {firstPlusInitial(b.accountName)}
                    </span>
                    <span className={styles.recentLast4}>
                      •••{b.accountNumber?.slice(-3)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Full beneficiaries list */}
        <section className={styles.beneficiaries}>
          <header className={styles.beneficiariesHead}>
            <h3 className={styles.beneficiariesTitle}>Saved beneficiaries</h3>
          </header>
          {benefError && <InlineError message={benefError} onRetry={refresh} />}
          {benefLoading ? (
            <div className={styles.list}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.listSkeleton}>
                  <Skeleton width={40} height={40} radius="50%" />
                  <Skeleton width="60%" height={12} />
                </div>
              ))}
            </div>
          ) : benefs.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No beneficiaries yet"
              body="Each time you send to someone, we'll save them here."
            />
          ) : (
            <ul className={styles.list}>
              {benefs.map((b) => (
                <li key={b._id} className={styles.row}>
                  <Link to={beneficiaryHref(b)} className={styles.rowLink}>
                    {b.type === 'bank'
                      ? <BankMark bankName={b.bankName || 'Bank'} />
                      : <Avatar name={b.accountName} />}
                    <div className={styles.rowText}>
                      <span className={styles.rowName}>{b.accountName}</span>
                      <span className={styles.rowSub}>
                        {b.accountNumber}
                        {b.type === 'bank' ? ` · ${b.bankName || 'Bank'}` : ' · Jara'}
                      </span>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className={styles.rowDelete}
                    onClick={() => handleDelete(b._id, b.accountName)}
                    aria-label={`Remove ${b.accountName}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function ChannelCard({ to, title, subtitle, image }) {
  return (
    <Link to={to} className={`${styles.channelCard} btn-lift`}>
      <div className={styles.channelThumb}>
        <Img image={image} aspect="1/1" className={styles.channelImg} />
        <span className={styles.channelScrim} aria-hidden="true" />
      </div>
      <div className={styles.channelText}>
        <span className={styles.channelTitle}>{title}</span>
        <span className={styles.channelSub}>{subtitle}</span>
      </div>
      <ChevronRight size={16} className={styles.chev} />
    </Link>
  );
}

function friendly(err) {
  return err?.response?.data?.error?.message || err?.message || 'Something went wrong';
}

function firstPlusInitial(name) {
  if (!name) return '—';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function beneficiaryHref(b) {
  if (b.type === 'bank') {
    return `/transfer/bank?bank=${b.bankCode}&to=${b.accountNumber}&name=${encodeURIComponent(b.accountName)}`;
  }
  return `/transfer/jara?to=${b.accountNumber}`;
}
