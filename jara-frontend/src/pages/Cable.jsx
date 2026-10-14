import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getMyAccount } from '../services/accounts';
import { getBillCatalogue, verifySmartcard, buyCable } from '../services/serviceTx';
import { formatNaira } from '../utils/format';
import styles from './Bills.module.css';

export default function Cable() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [catalogue, setCat]   = useState(null);
  const [step, setStep]       = useState('form');

  const [providerId, setProviderId] = useState('');
  const [packageId,  setPackageId]  = useState('');
  const [smartcard,  setSmartcard]  = useState('');
  const [phone,      setPhone]      = useState('');
  const [verified,   setVerified]   = useState(null);
  const [verifying,  setVerifying]  = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyAccount().then(setAccount).catch(() => {});
    getBillCatalogue().then((c) => {
      setCat(c);
      const firstProvider = c.cable.providers[0]?.id || '';
      setProviderId(firstProvider);
      const firstPackage = c.cable.packages.find((p) => p.providerId === firstProvider);
      setPackageId(firstPackage?.id || '');
    }).catch(() => {});
  }, []);

  const packagesForProvider = useMemo(
    () => catalogue?.cable.packages.filter((p) => p.providerId === providerId) || [],
    [catalogue, providerId],
  );

  const provider = catalogue?.cable.providers.find((p) => p.id === providerId);
  const pkg = packagesForProvider.find((p) => p.id === packageId);

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  async function handleVerify() {
    setError('');
    setVerifying(true);
    try {
      const r = await verifySmartcard({ providerId, smartcard });
      setVerified(r);
    } catch (err) { setError(friendlyError(err)); setVerified(null); }
    finally { setVerifying(false); }
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    if (!pkg) return setError('Select a package');
    if (!/^\d{8,14}$/.test(smartcard)) return setError('Enter a valid smart-card number');
    if (account && pkg.priceKobo > account.balance) return setError('Package cost exceeds your balance');
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
      const tx = await buyCable({
        providerId, packageId, smartcard, phone, pin: pinVal,
      });
      setResult(tx);
      setStep('success');
    } catch (err) { setError(friendlyError(err)); setPin(''); }
    finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="TV Subscription" to="/dashboard" />

      {step === 'form' && (
        <>
          {account && <BalanceCard account={account} />}

          <form className={styles.form} onSubmit={handleContinue} noValidate>
            <span className={styles.label}>Provider</span>
            <select className={styles.select} value={providerId}
              onChange={(e) => {
                const id = e.target.value;
                setProviderId(id);
                const first = catalogue.cable.packages.find((p) => p.providerId === id);
                setPackageId(first?.id || '');
                setVerified(null);
              }}>
              {catalogue?.cable.providers.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>

            <span className={styles.label}>Package</span>
            <select className={styles.select} value={packageId}
              onChange={(e) => setPackageId(e.target.value)}>
              {packagesForProvider.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {formatNaira(p.priceKobo / 100)}
                </option>
              ))}
            </select>

            <span className={styles.label}>Smart-Card / IUC</span>
            <input className={styles.pillInput}
              type="text" inputMode="numeric" maxLength={14}
              placeholder="Enter smart-card number"
              value={smartcard}
              onChange={(e) => { setSmartcard(e.target.value.replace(/\D/g, '').slice(0, 14)); setVerified(null); }} />

            <button type="button" className={styles.verifyBtn}
              onClick={handleVerify} disabled={verifying || smartcard.length < 8}>
              {verifying ? 'Verifying…' : verified ? 'Re-verify' : 'Verify smart-card'}
            </button>

            {verified && (
              <div className={styles.verifiedBox}>
                <strong>{verified.customerName}</strong>
                {verified.accountType && <span>{verified.accountType}</span>}
              </div>
            )}

            <span className={styles.label}>Notification Phone (optional)</span>
            <input className={styles.pillInput}
              type="tel" maxLength={11}
              placeholder="Phone for receipt"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />

            {pkg && (
              <div className={styles.priceRow}>
                <span>Total</span>
                <span>{formatNaira(pkg.priceKobo / 100, { decimals: 2 })}</span>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={!smartcard || !packageId}>
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
          title="Subscription Successful"
          subtitle={`${pkg?.label} activated on smart-card ${smartcard}.`}
          ctaLabel="Done"
          onCta={() => navigate('/dashboard', { replace: true })}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Subscription"
        rows={[
          { label: 'Provider', value: provider?.label || providerId },
          { label: 'Package',  value: pkg?.label || '' },
          { label: 'Smart-Card', value: smartcard },
          ...(verified ? [{ label: 'Customer', value: verified.customerName }] : []),
          { label: 'Amount', value: formatNaira((pkg?.priceKobo || 0) / 100, { decimals: 2 }) },
        ]}
        ctaLabel="Continue"
        onConfirm={() => { setConfirmOpen(false); setStep('pin'); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
