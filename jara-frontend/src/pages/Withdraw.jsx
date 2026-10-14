import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import AmountInput from '../components/ui/AmountInput';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import BankMark from '../components/ui/BankMark';
import StatusPill from '../components/ui/StatusPill';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import FeeLine from '../components/transfer/FeeLine';
import ReviewSheet from '../components/transfer/ReviewSheet';
import ReceiptSheet from '../components/receipt/ReceiptSheet';
import { getMyAccount } from '../services/accounts';
import { listBeneficiaries } from '../services/beneficiaries';
import { executeBankTransfer } from '../services/banks';
import { feeForTransfer, validateAmount, LIMITS } from '../utils/transferLimits';
import { formatNaira } from '../utils/format';
import styles from './Withdraw.module.css';

/**
 * Withdraw — cash out to a saved bank destination. Reuses the Transfer
 * primitives (ReviewSheet + ReceiptSheet) and the bank-transfer backend
 * so withdrawals end up in the same immutable ledger.
 */
export default function Withdraw() {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [acctError, setAcctError] = useState('');
  const [benefs, setBenefs]       = useState([]);
  const [benefError, setBenefError] = useState('');
  const [loading, setLoading]     = useState(true);

  const [selected, setSelected] = useState(null);
  const [amountKobo, setAmountKobo] = useState(0);
  const [remark, setRemark] = useState('Wallet withdrawal');

  const [reviewOpen, setReviewOpen] = useState(false);
  const [step, setStep]       = useState('form');
  const [pin, setPin]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [transfer, setTransfer] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.allSettled([getMyAccount(), listBeneficiaries()])
      .then(([a, b]) => {
        if (a.status === 'fulfilled') setAccount(a.value);
        else setAcctError(friendly(a.reason));
        if (b.status === 'fulfilled') {
          const banks = (b.value || []).filter((x) => x.type === 'bank');
          setBenefs(banks);
          if (banks.length === 1) setSelected(banks[0]);
        } else {
          setBenefError(friendly(b.reason));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const walletKobo = account?.balance ?? 0;
  const feeKobo    = feeForTransfer({ type: 'bank' });
  const totalKobo  = amountKobo + feeKobo;
  const amountErr  = validateAmount({ amountKobo, type: 'bank', walletKobo });
  const canSend    = Boolean(selected && amountKobo && !amountErr);

  const title = useMemo(() => 'Withdraw to a saved bank', []);

  function submitForm(e) {
    e.preventDefault();
    if (!canSend) return;
    setError('');
    setReviewOpen(true);
  }
  function startPinStep() {
    setReviewOpen(false);
    setPin(''); setError('');
    setStep('pin');
  }
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
      const t = await executeBankTransfer({
        bankCode:      selected.bankCode,
        accountNumber: selected.accountNumber,
        accountName:   selected.accountName,
        amountNaira:   amountKobo / 100,
        remark,
        pin: codeVal,
      });
      setTransfer(t);
      setStep('success');
    } catch (err) {
      setError(friendly(err));
      setPin('');
    } finally {
      setSubmitting(false);
    }
  }

  const receiptTx = transfer ? {
    kind: 'transfer',
    type: 'bank',
    reference:   transfer.reference,
    createdAt:   transfer.createdAt || new Date().toISOString(),
    direction:   'debit',
    amountKobo:  -(amountKobo),
    status:      transfer.status || 'completed',
    sender:      'You',
    recipient:   selected?.accountName,
    bank:        selected?.bankName,
    remark:      remark || undefined,
    feeKobo,
    sessionId:   transfer.sessionId,
  } : null;

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <MobileHeader title={title} to="/transfer" />

        {step === 'form' && (
          <form onSubmit={submitForm} className={styles.form} noValidate>
            {acctError && <InlineError message={acctError} />}
            {benefError && <InlineError message={benefError} />}

            <div className={styles.wallet}>
              <span>Available balance</span>
              <strong>{formatNaira(walletKobo / 100, { decimals: 2 })}</strong>
            </div>

            {loading ? (
              <p className={styles.hint}>Loading your saved banks…</p>
            ) : benefs.length === 0 ? (
              <div className={styles.empty}>
                <p>You don't have any saved bank destinations yet.</p>
                <Link to="/transfer/bank" className={styles.emptyCta}>
                  Send to a bank first
                </Link>
              </div>
            ) : (
              <ul className={styles.benefList}>
                {benefs.map((b) => {
                  const on = selected?._id === b._id;
                  return (
                    <li key={b._id}>
                      <button
                        type="button"
                        onClick={() => setSelected(b)}
                        className={`${styles.benefRow} ${on ? styles.benefRowOn : ''} btn-lift`}
                        aria-pressed={on}
                      >
                        <BankMark bankName={b.bankName || 'Bank'} />
                        <div className={styles.benefText}>
                          <span className={styles.benefName}>{b.accountName}</span>
                          <span className={styles.benefMeta}>
                            {b.bankName || 'Bank'} · {b.accountNumber}
                          </span>
                        </div>
                        <span className={`${styles.radio} ${on ? styles.radioOn : ''}`} />
                      </button>
                    </li>
                  );
                })}
                <li>
                  <Link to="/transfer/bank" className={styles.newLink}>
                    <Plus size={14} /> Add new bank
                  </Link>
                </li>
              </ul>
            )}

            <AmountInput
              label="Amount"
              valueKobo={amountKobo}
              onChange={setAmountKobo}
              min={LIMITS.minKobo}
              max={LIMITS.maxKobo}
              error={amountKobo > 0 ? amountErr : ''}
              helper={!amountKobo
                ? `Min ${formatNaira(LIMITS.minKobo / 100)} · max ${formatNaira(LIMITS.maxKobo / 100)}`
                : undefined}
            />
            {amountKobo > 0 && (
              <FeeLine amountKobo={amountKobo} feeKobo={feeKobo} walletKobo={walletKobo} />
            )}

            <Input
              label="Note (optional)"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={100}
            />

            <InlineError message={error} />

            <Button type="submit" variant="primary" size="lg" fullWidth disabled={!canSend}>
              Review withdrawal
            </Button>
          </form>
        )}

        {step === 'pin' && (
          <div className={styles.pinStep}>
            <h2 className={styles.pinTitle}>Enter your transfer PIN</h2>
            <PinDisplay length={4} value={pin} />
            <InlineError message={error} />
            {submitting && <p className={styles.pinHint}>Sending…</p>}
            <MobileKeypad onKey={handleKey} />
          </div>
        )}

        {step === 'success' && receiptTx && (
          <div className={styles.success}>
            <div className={styles.medallion} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 L9 17 L4 12" />
              </svg>
            </div>
            <h2 className={styles.pinTitle}>
              {receiptTx.status === 'pending' ? 'Withdrawal processing' : 'Withdrawal sent'}
            </h2>
            <p className={styles.successBody}>
              {formatNaira(amountKobo / 100, { decimals: 2 })} → <strong>{selected?.accountName}</strong>
              {' '}at {selected?.bankName}.
            </p>
            <StatusPill status={receiptTx.status} />
            <div className={styles.successCtas}>
              <Button variant="secondary" onClick={() => setReceiptOpen(true)}>View receipt</Button>
              <Button variant="primary" onClick={() => navigate('/dashboard', { replace: true })}>Done</Button>
            </div>
          </div>
        )}

        <ReviewSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onConfirm={startPinStep}
          title="Confirm withdrawal"
          totalKobo={totalKobo}
          rows={[
            { label: 'Destination', value: selected?.accountName || '—' },
            { label: 'Bank',        value: selected?.bankName || '—' },
            { label: 'Account',     value: selected?.accountNumber || '—' },
            { label: 'Amount',      value: formatNaira(amountKobo / 100, { decimals: 2 }) },
            { label: 'Fee',         value: feeKobo === 0 ? 'Free' : formatNaira(feeKobo / 100, { decimals: 2 }) },
            ...(remark ? [{ label: 'Note', value: remark }] : []),
          ]}
          ctaLabel="Enter PIN"
        />

        <ReceiptSheet
          open={receiptOpen}
          onClose={() => setReceiptOpen(false)}
          tx={receiptTx}
        />
      </div>
    </>
  );
}

function friendly(err) {
  return err?.response?.data?.error?.message
    || err?.response?.data?.error?.details?.map((d) => d.message).join(' · ')
    || err?.message
    || 'Something went wrong';
}
