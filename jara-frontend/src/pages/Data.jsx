import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getMyAccount } from '../services/accounts';
import { listNetworks, listDataPlans, buyData } from '../services/serviceTx';
import { formatNaira } from '../utils/format';
import styles from './Data.module.css';

const BUCKETS = ['daily', 'weekly', 'monthly'];

export default function Data() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [step, setStep] = useState('form');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [bucket, setBucket] = useState('monthly');
  const [planId, setPlanId] = useState('');
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyAccount().then(setAccount).catch(() => {});
    listNetworks().then(setNetworks).catch(() => {});
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlanId('');
    listDataPlans(network).then(setPlans).catch(() => setPlans([]));
  }, [network]);

  const shownPlans   = useMemo(() => plans.filter((p) => p.bucket === bucket), [plans, bucket]);
  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId) || null, [plans, planId]);
  const netMeta = networks.find((n) => n.id === network) || {};

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    if (!phone) return setError('Enter a phone number');
    if (!selectedPlan) return setError('Pick a data plan');
    if (account && selectedPlan.priceKobo > account.balance) return setError('Plan exceeds your balance');
    setConfirmOpen(true);
  }

  function handleConfirm() { setConfirmOpen(false); setStep('pin'); }

  function handleKey(k) {
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return; }
    setPin((p) => {
      const next = (p + k).slice(0, 4);
      if (next.length === 4 && !submitting) setTimeout(() => submit(next), 60);
      return next;
    });
  }

  async function submit(codeVal) {
    setError('');
    setSubmitting(true);
    try {
      const tx = await buyData({ network, phone, planId, pin: codeVal });
      setResult(tx);
      setStep('success');
    } catch (err) {
      setError(friendlyError(err));
      setPin('');
    } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Data" to="/dashboard" />

      {step === 'form' && (
        <>
          {account && <BalanceCard account={account} />}

          <form className={styles.form} onSubmit={handleContinue} noValidate>
            <div className={styles.selectWrap}>
              <select className={styles.select} value={network} onChange={(e) => setNetwork(e.target.value)}>
                {networks.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <span className={styles.selectDot} style={{ background: netMeta.color }} />
            </div>

            <input className={styles.pillInput}
              type="text" inputMode="numeric" maxLength={11}
              placeholder="Enter Mobile Number"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />

            <div className={styles.plansSection}>
              <span className={styles.plansLabel}>Data Plans</span>
              <div className={styles.buckets}>
                {BUCKETS.map((b) => (
                  <button key={b} type="button"
                    className={`${styles.bucket} ${bucket === b ? styles.bucketActive : ''}`}
                    onClick={() => setBucket(b)}>
                    {cap(b)}
                  </button>
                ))}
              </div>
              <div className={styles.planGrid}>
                {shownPlans.length === 0 && <p className={styles.emptyHint}>No plans in this tab.</p>}
                {shownPlans.map((p) => (
                  <button key={p.id} type="button"
                    className={`${styles.planCard} ${planId === p.id ? styles.planActive : ''}`}
                    onClick={() => setPlanId(p.id)}>
                    <span className={styles.planName}>{p.name}</span>
                    <span className={styles.planValidity}>{p.validity}</span>
                    <span className={styles.planPrice}>{formatNaira(p.priceKobo / 100)}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={!phone || !planId}>Continue</button>
          </form>
        </>
      )}

      {step === 'pin' && (
        <div className={styles.pinScreen}>
          <h2 className={styles.pinTitle}>Enter Transaction Pin</h2>
          <PinDisplay length={4} value={pin} />
          {error && <div className={styles.error}>{error}</div>}
          {submitting && <p className={styles.hint}>Purchasing…</p>}
          <MobileKeypad onKey={handleKey} />
        </div>
      )}

      {step === 'success' && result && selectedPlan && (
        <SuccessSheet
          title="Congratulations"
          subtitle={`Your data plan ${selectedPlan.name} for ${phone} was activated.`}
          ctaLabel="Continue"
          onCta={() => navigate('/dashboard', { replace: true })}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Transaction Details"
        rows={selectedPlan ? [
          { label: 'Recipient Mobile', value: phone },
          { label: 'Data Type', value: `${selectedPlan.name} · ${selectedPlan.validity}` },
          { label: 'Data Provider', value: netMeta.name || network },
          { label: 'Transaction Type', value: 'Data' },
          { label: 'Amount', value: formatNaira(selectedPlan.priceKobo / 100) },
        ] : []}
        ctaLabel="Continue"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
