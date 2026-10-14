import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import AmountInput from '../components/ui/AmountInput';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatusPill from '../components/ui/StatusPill';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import AccountLookup from '../components/transfer/AccountLookup';
import FeeLine from '../components/transfer/FeeLine';
import ReviewSheet from '../components/transfer/ReviewSheet';
import ReceiptSheet from '../components/receipt/ReceiptSheet';
import { getMyAccount } from '../services/accounts';
import { quoteJaraTransfer, executeJaraTransfer } from '../services/transfers';
import { feeForTransfer, validateAmount, LIMITS } from '../utils/transferLimits';
import { formatNaira } from '../utils/format';
import styles from './TransferJara.module.css';

/**
 * TransferJara — send to another Jara user by 10-digit account number.
 *
 * Same shape as TransferBank: lookup → amount + fee preview → review
 * sheet → PIN → success → receipt. Avatar for the recipient instead of
 * a BankMark.
 */
export default function TransferJara() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [acctError, setAcctError] = useState('');
  const [accountNumber, setAccountNumber] = useState(
    /^\d{10}$/.test(params.get('to') || '') ? params.get('to') : '',
  );
  const [lookup, setLookup] = useState({ state: 'idle', name: '', error: '' });

  const [amountKobo, setAmountKobo] = useState(0);
  const [remark, setRemark] = useState('');

  const [reviewOpen, setReviewOpen] = useState(false);
  const [step, setStep]       = useState('form');
  const [pin, setPin]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [transfer, setTransfer] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Load wallet.
  useEffect(() => {
    getMyAccount()
      .then(setAccount)
      .catch((err) => setAcctError(friendly(err)));
  }, []);

  // Debounced quote.
  const debounceRef = useRef(0);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!/^\d{10}$/.test(accountNumber)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLookup({ state: 'idle', name: '', error: '' });
      return;
    }
    setLookup({ state: 'looking', name: '', error: '' });
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await quoteJaraTransfer({ toAccountNumber: accountNumber });
        setLookup({ state: 'found', name: r.accountName, error: '' });
      } catch (err) {
        setLookup({ state: 'error', name: '', error: friendly(err) });
      }
    }, 300);
  }, [accountNumber]);

  const walletKobo = account?.balance ?? 0;
  const feeKobo    = feeForTransfer({ type: 'jara' });
  const totalKobo  = amountKobo + feeKobo;
  const amountErr  = validateAmount({ amountKobo, type: 'jara', walletKobo });
  const canSend    = lookup.state === 'found' && amountKobo && !amountErr;

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
      const t = await executeJaraTransfer({
        toAccountNumber: accountNumber,
        amountNaira: amountKobo / 100,
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
    type: 'jara',
    reference:   transfer.reference,
    createdAt:   transfer.createdAt || new Date().toISOString(),
    direction:   'debit',
    amountKobo:  -(amountKobo),
    status:      transfer.status || 'completed',
    sender:      'You',
    recipient:   lookup.name,
    remark:      remark || undefined,
    feeKobo,
    sessionId:   transfer.sessionId,
  } : null;

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <MobileHeader title="Send to Jara" to="/transfer" />

        {step === 'form' && (
          <form onSubmit={submitForm} className={styles.form} noValidate>
            {acctError && <InlineError message={acctError} />}

            <div className={styles.wallet}>
              <span>Available balance</span>
              <strong>{formatNaira(walletKobo / 100, { decimals: 2 })}</strong>
            </div>

            <Input
              label="Jara account number"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="9123456789"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              helper="10 digits starting with 9."
            />

            {/* Recipient preview card */}
            {lookup.state === 'found' && (
              <div className={styles.recipient}>
                <Avatar name={lookup.name} />
                <div className={styles.recipientText}>
                  <span className={styles.recipientLabel}>Sending to</span>
                  <span className={styles.recipientName}>{lookup.name}</span>
                </div>
              </div>
            )}
            {lookup.state !== 'found' && (
              <AccountLookup state={lookup.state} name={lookup.name} error={lookup.error} />
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
              label="Remark (optional)"
              placeholder="e.g. Lunch · Rent split"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={100}
            />

            <InlineError message={error} />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canSend}
            >
              Review transfer
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
              {receiptTx.status === 'pending' ? 'Transfer processing' : 'Transfer sent'}
            </h2>
            <p className={styles.successBody}>
              {formatNaira(amountKobo / 100, { decimals: 2 })} to <strong>{lookup.name}</strong>. We've saved them as a beneficiary.
            </p>
            <StatusPill status={receiptTx.status} />
            <div className={styles.successCtas}>
              <Button variant="secondary" onClick={() => setReceiptOpen(true)}>
                View receipt
              </Button>
              <Button variant="primary" onClick={() => navigate('/dashboard', { replace: true })}>
                Done
              </Button>
            </div>
          </div>
        )}

        <ReviewSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onConfirm={startPinStep}
          title="Confirm Jara transfer"
          totalKobo={totalKobo}
          rows={[
            { label: 'To',      value: lookup.name },
            { label: 'Account', value: accountNumber },
            { label: 'Amount',  value: formatNaira(amountKobo / 100, { decimals: 2 }) },
            { label: 'Fee',     value: feeKobo === 0 ? 'Free' : formatNaira(feeKobo / 100, { decimals: 2 }) },
            ...(remark ? [{ label: 'Remark', value: remark }] : []),
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
