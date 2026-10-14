import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BalanceCard from '../components/BalanceCard';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getMyAccount } from '../services/accounts';
import { getBillCatalogue, buyEducation } from '../services/serviceTx';
import { formatNaira } from '../utils/format';
import styles from './Bills.module.css';

export default function Education() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [catalogue, setCat]   = useState(null);
  const [step, setStep]       = useState('form');

  const [providerId, setProviderId] = useState('');
  const [productId,  setProductId]  = useState('');
  const [phone,      setPhone]      = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyAccount().then(setAccount).catch(() => {});
    getBillCatalogue().then((c) => {
      setCat(c);
      const firstProvider = c.education.providers[0]?.id || '';
      setProviderId(firstProvider);
      const first = c.education.products.find((p) => p.providerId === firstProvider);
      setProductId(first?.id || '');
    }).catch(() => {});
  }, []);

  const productsForProvider = useMemo(
    () => catalogue?.education.products.filter((p) => p.providerId === providerId) || [],
    [catalogue, providerId],
  );

  const provider = catalogue?.education.providers.find((p) => p.id === providerId);
  const product  = productsForProvider.find((p) => p.id === productId);

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleContinue(e) {
    e.preventDefault();
    setError('');
    if (!product) return setError('Select a product');
    if (phone && !/^0?[789]\d{9}$/.test(phone.replace(/^\+234/, '0'))) {
      return setError('Enter a valid phone number');
    }
    if (account && product.priceKobo > account.balance) return setError('Cost exceeds your balance');
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
      const tx = await buyEducation({ providerId, productId, phone, pin: pinVal });
      setResult(tx);
      setStep('success');
    } catch (err) { setError(friendlyError(err)); setPin(''); }
    finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Education" to="/dashboard" />

      {step === 'form' && (
        <>
          {account && <BalanceCard account={account} />}

          <form className={styles.form} onSubmit={handleContinue} noValidate>
            <span className={styles.label}>Institution</span>
            <select className={styles.select} value={providerId}
              onChange={(e) => {
                const id = e.target.value;
                setProviderId(id);
                const first = catalogue.education.products.find((p) => p.providerId === id);
                setProductId(first?.id || '');
              }}>
              {catalogue?.education.providers.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>

            <span className={styles.label}>Product</span>
            <select className={styles.select} value={productId}
              onChange={(e) => setProductId(e.target.value)}>
              {productsForProvider.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {formatNaira(p.priceKobo / 100)}
                </option>
              ))}
            </select>

            <span className={styles.label}>Delivery Phone (optional)</span>
            <input className={styles.pillInput}
              type="tel" maxLength={11}
              placeholder="Phone for the PIN receipt"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} />

            {product && (
              <div className={styles.priceRow}>
                <span>Total</span>
                <span>{formatNaira(product.priceKobo / 100, { decimals: 2 })}</span>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submit} disabled={!productId}>
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
          title="Purchase Successful"
          subtitle={`${product?.label} purchased.`}
          ctaLabel="Done"
          onCta={() => navigate('/dashboard', { replace: true })}
        >
          {result.token && (
            <>
              <p className={styles.tokenLabel}>Your PIN</p>
              <div className={styles.tokenBox}>{result.token}</div>
            </>
          )}
        </SuccessSheet>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Purchase"
        rows={[
          { label: 'Institution', value: provider?.label || providerId },
          { label: 'Product',     value: product?.label || '' },
          ...(phone ? [{ label: 'Delivery Phone', value: phone }] : []),
          { label: 'Amount', value: formatNaira((product?.priceKobo || 0) / 100, { decimals: 2 }) },
        ]}
        ctaLabel="Continue"
        onConfirm={() => { setConfirmOpen(false); setStep('pin'); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
