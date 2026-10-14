import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getMyAccount } from '../services/accounts';
import { getBillCatalogue, verifyMeter, buyElectricity } from '../services/serviceTx';
import { formatNaira } from '../utils/format';
import styles from './Bills.module.css';

export default function Electricity() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [catalogue, setCat]   = useState(null);
  const [step, setStep]       = useState('form');

  const [discoId, setDiscoId]     = useState('');
  const [meterType, setMeterType] = useState('prepaid');
  const [meter, setMeter]         = useState('');
  const [phone, setPhone]         = useState('');
  const [amount, setAmount]       = useState('');
  const [verified, setVerified]   = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyAccount().then(setAccount).catch(() => {});
    getBillCatalogue().then((c) => {
      setCat(c);
      setDiscoId(c.electricity.discos[0]?.id || '');
    }).catch(() => {});
  }, []);

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  async function handleVerify() {
    setError('');
    setVerifying(true);
    try {
      const r = await verifyMeter({ discoId, meterNumber: meter, meterType });
      setVerified(r);
    } catch (err) { setError(friendlyError(err)); setVerified(null); }
    finally { setVerifying(false); }
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    const parsed = Number(amount);
    if (!discoId) return setError('Choose a distribution company');
    if (!/^\d{6,20}$/.test(meter)) return setError('Enter a valid meter number (6–20 digits)');
    if (!(parsed >= 500)) return setError('Minimum electricity purchase is ₦500');
    if (account && parsed * 100 > account.balance) return setError('Amount exceeds your balance');
    setConfirmOpen(true);
  }

  function handleKey(k) {
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return; }
    setPin((p) => {
      const next = (p + k).slice(0, 4);
      if (next.length === 4 && !submitting) setTimeout(() => submit(next), 60);
      return next;
    });
  }

  async function submit(pinVal) {
    setError('');
    setSubmitting(true);
    try {
      const tx = await buyElectricity({
        discoId, meterNumber: meter, meterType,
        amountNaira: Number(amount), phone, pin: pinVal,
      });
      setResult(tx);
      setStep('success');
    } catch (err) { setError(friendlyError(err)); setPin(''); }
    finally { setSubmitting(false); }
  }

  const disco = catalogue?.electricity.discos.find((d) => d.id === discoId);

  return (
    <div className={styles.page}>
      <MobileHeader title="Electricity" to="/dashboard" />

      {step === 'form' && (
        <>
          {account && <BalanceCard account={account} />}

          <form className={styles.form} onSubmit={handleContinue} noValidate>
            <span className={styles.label}>Distribution Company</span>
            <select className={styles.select} value={discoId}
              onChange={(e) => { setDiscoId(e.target.value); setVerified(null); }}>
              {catalogue?.electricity.discos.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>

            <span className={styles.label}>Meter Type</span>
            <div className={styles.radioRow}>
              {catalogue?.electricity.meterTypes.map((m) => (
                <button key={m.id} type="button"
                  className={`${styles.radio} ${meterType === m.id ? styles.radioActive : ''}`}
                  onClick={() => { setMeterType(m.id); setVerified(null); }}>
                  {m.label}
                </button>
              ))}
            </div>

            <span className={styles.label}>Meter Number</span>
            <input className={styles.pillInput}
              type="text" inputMode="numeric" maxLength={20}
              placeholder="Enter meter number"
              value={meter}
              onChange={(e) => { setMeter(e.target.value.replace(/\D/g, '').slice(0, 20)); setVerified(null); }} />

            <button type="button" className={styles.verifyBtn}
              onClick={handleVerify} disabled={verifying || meter.length < 6}>
              {verifying ? 'Verifying…' : verified ? 'Re-verify' : 'Verify meter'}
            </button>

            {verified && (
              <div className={styles.verifiedBox}>
                <strong>{verified.customerName}</strong>
                {verified.address && <span>{verified.address}</span>}
              </div>
            )}

            <span className={styles.label}>Amount (₦)</span>
            <div className={styles.amountRow}>
              <span className={styles.n}>₦</span>
              <input type="number" min="500" step="100" placeholder="Enter amount"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>

            <span className={styles.label}>Notification Phone (optional)</span>
            <input className={styles.pillInput}
              type="tel" maxLength={11}
              placeholder="Phone for receipt"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={!meter || !amount}>
              Continue
            </button>
          </form>
        </>
      )}

      {step === 'pin' && (
        <div className={styles.pinScreen}>
          <h2 className={styles.pinTitle}>Enter Transaction Pin</h2>
          <PinDisplay length={4} value={pin} />
          {error && <div className={styles.error}>{error}</div>}
          {submitting && <p className={styles.hint}>Processing…</p>}
          <MobileKeypad onKey={handleKey} />
        </div>
      )}

      {step === 'success' && result && (
        <SuccessSheet
          title="Payment Successful"
          subtitle={`₦${amount} paid to ${disco?.short || 'your disco'}.`}
          ctaLabel="Done"
          onCta={() => navigate('/dashboard', { replace: true })}
        >
          {result.token && (
            <>
              <p className={styles.tokenLabel}>Token</p>
              <div className={styles.tokenBox}>{result.token}</div>
            </>
          )}
        </SuccessSheet>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Payment"
        rows={[
          { label: 'Distribution Co.', value: disco?.label || discoId },
          { label: 'Meter', value: `${meter} (${meterType})` },
          ...(verified ? [{ label: 'Customer', value: verified.customerName }] : []),
          { label: 'Amount', value: formatNaira(Number(amount), { decimals: 2 }) },
        ]}
        ctaLabel="Continue"
        onConfirm={() => { setConfirmOpen(false); setStep('pin'); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
