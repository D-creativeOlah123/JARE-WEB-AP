import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getMyAccount } from '../services/accounts';
import { listNetworks, buyAirtime } from '../services/serviceTx';
import { formatNaira } from '../utils/format';
import styles from './Airtime.module.css';

const QUICK = [100, 200, 500, 1000, 2000];

export default function Airtime() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [networks, setNetworks] = useState([]);
  const [step, setStep] = useState('form');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyAccount().then(setAccount).catch(() => {});
    listNetworks().then(setNetworks).catch(() => {});
  }, []);

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    const parsed = Number(amount);
    if (!phone) return setError('Enter a phone number');
    if (!(parsed >= 50)) return setError('Minimum airtime is ₦50');
    if (account && parsed * 100 > account.balance) return setError('Amount exceeds your balance');
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
      const tx = await buyAirtime({ network, phone, amountNaira: Number(amount), pin: codeVal });
      setResult(tx);
      setStep('success');
    } catch (err) {
      setError(friendlyError(err));
      setPin('');
    } finally { setSubmitting(false); }
  }

  const netMeta = networks.find((n) => n.id === network) || {};

  return (
    <div className={styles.page}>
      <MobileHeader title="Airtime" to="/dashboard" />

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

            <div className={styles.amountRow}>
              <span className={styles.n}>₦</span>
              <input type="number" min="50" step="50" placeholder="Enter Amount"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <div className={styles.chips}>
              {QUICK.map((v) => (
                <button key={v} type="button"
                  className={`${styles.chip} ${Number(amount) === v ? styles.chipActive : ''}`}
                  onClick={() => setAmount(String(v))}>
                  ₦{v}
                </button>
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={!phone || !amount}>Continue</button>
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

      {step === 'success' && result && (
        <SuccessSheet
          title="Congratulations"
          subtitle={`Your airtime of ${formatNaira(Number(amount), { decimals: 2 })} for ${phone} was successful.`}
          ctaLabel="Continue"
          onCta={() => navigate('/dashboard', { replace: true })}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Transaction Details"
        rows={[
          { label: 'Recipient Mobile', value: phone },
          { label: 'Airtime Amount', value: formatNaira(Number(amount), { decimals: 2 }) },
          { label: 'Transaction Type', value: `${netMeta.name || network} Airtime` },
        ]}
        ctaLabel="Continue"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
