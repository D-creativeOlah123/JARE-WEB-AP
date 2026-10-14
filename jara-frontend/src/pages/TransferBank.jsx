import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
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
import BankPickerSheet from '../components/transfer/BankPickerSheet';
import AccountLookup from '../components/transfer/AccountLookup';
import FeeLine from '../components/transfer/FeeLine';
import ReviewSheet from '../components/transfer/ReviewSheet';
import ReceiptSheet from '../components/receipt/ReceiptSheet';
import { getMyAccount } from '../services/accounts';
import { verifyBankAccount, executeBankTransfer, listBanks } from '../services/banks';
import { feeForTransfer, validateAmount, LIMITS } from '../utils/transferLimits';
import { formatNaira } from '../utils/format';
import styles from './TransferBank.module.css';

/**
 * TransferBank — pick a bank, resolve the account, enter the amount,
 * review, PIN, success → receipt.
 *
 * Supports deep-linking: `?bank=&to=&name=` from the beneficiary list.
 */
export default function TransferBank() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [acctError, setAcctError] = useState('');

  const [bank, setBank] = useState(null);         // {code, name}
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState({ state: 'idle', name: '', error: '' });

  const [amountKobo, setAmountKobo] = useState(0);
  const [remark, setRemark] = useState('');

  const [reviewOpen, setReviewOpen] = useState(false);
  const [step, setStep]       = useState('form');  // form | pin | success
  const [pin, setPin]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [transfer, setTransfer] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Load wallet + hydrate from the deep-link params.
  useEffect(() => {
    getMyAccount()
      .then(setAccount)
      .catch((err) => setAcctError(friendly(err)));
    const bankCode = params.get('bank');
    const to       = params.get('to');
    const name     = params.get('name');
    if (bankCode && /^\d{10}$/.test(to || '')) {
      // Resolve the bank name from the banks list for a nicer label.
      listBanks().then((banks) => {
        const match = (banks || []).find((b) => b.code === bankCode);
        setBank(match || { code: bankCode, name: 'Bank' });
      }).catch(() => setBank({ code: bankCode, name: 'Bank' }));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccountNumber(to);
      if (name) setLookup({ state: 'found', name: decodeURIComponent(name), error: '' });
    }
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced account lookup once we have both bank + 10 digits.
  const debounceRef = useRef(0);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!bank || !/^\d{10}$/.test(accountNumber)) {
      // If we had a name from the deep-link, don't wipe it until the user
      // actually changes the number.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lookup.state !== 'found' || accountNumber === '') setLookup({ state: 'idle', name: '', error: '' });
      return;
    }
    setLookup({ state: 'looking', name: '', error: '' });
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await verifyBankAccount({ bankCode: bank.code, accountNumber });
        setLookup({ state: 'found', name: r.accountName, error: '' });
      } catch (err) {
        setLookup({ state: 'error', name: '', error: friendly(err) });
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank?.code, accountNumber]);

  const walletKobo = account?.balance ?? 0;
  const feeKobo    = feeForTransfer({ type: 'bank' });
  const totalKobo  = amountKobo + feeKobo;
  const amountErr  = validateAmount({ amountKobo, type: 'bank', walletKobo });
  const canSend    = Boolean(bank && lookup.state === 'found' && amountKobo && !amountErr);

  function submitForm(e) {
    e.preventDefault();
    if (!canSend) return;
    setError('');
    setReviewOpen(true);
  }

  function startPinStep() {
    setReviewOpen(false);
    setPin('');
    setError('');
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
        bankCode:      bank.code,
        accountNumber,
        accountName:   lookup.name,
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

  // Build the receipt object once we have a server response.
  const receiptTx = transfer ? {
    kind: 'transfer',
    type: 'bank',
    reference:   transfer.reference,
    createdAt:   transfer.createdAt || new Date().toISOString(),
    direction:   'debit',
    amountKobo:  -(amountKobo),
    status:      transfer.status || 'completed',
    sender:      'You',
    recipient:   lookup.name,
    bank:        bank?.name,
    remark:      remark || undefined,
    feeKobo,
    sessionId:   transfer.sessionId,
  } : null;

  return (
    <>
      <OfflineBanner />
      <div className={styles.page}>
        <MobileHeader title="Send to bank" to="/transfer" />

        {step === 'form' && (
          <form onSubmit={submitForm} className={styles.form} noValidate>
            {acctError && <InlineError message={acctError} />}

            <WalletChip walletKobo={walletKobo} />

            {/* Bank picker trigger */}
            <button
              type="button"
              className={styles.pickerTrigger}
              onClick={() => setBankPickerOpen(true)}
              aria-haspopup="dialog"
              aria-label="Choose bank"
            >
              {bank
                ? <>
                    <BankMark bankName={bank.name} />
                    <div className={styles.pickerText}>
                      <span className={styles.pickerLabel}>Bank</span>
                      <span className={styles.pickerValue}>{bank.name}</span>
                    </div>
                  </>
                : <>
                    <span className={styles.pickerPlaceholder}>Choose a bank</span>
                  </>}
              <ChevronDown size={16} />
            </button>

            <Input
              label="Account number"
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="10-digit account number"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
              }
              helper="We'll verify the account before you continue."
            />
            <AccountLookup
              state={lookup.state}
              name={lookup.name}
              error={lookup.error}
            />

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
              placeholder="e.g. Rent · School · Fuel"
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
            <SuccessMedallion />
            <h2 className={styles.pinTitle}>
              {receiptTx.status === 'pending' ? 'Transfer processing' : 'Transfer sent'}
            </h2>
            <p className={styles.successBody}>
              {formatNaira(amountKobo / 100, { decimals: 2 })} to <strong>{lookup.name}</strong>
              {' '}at {bank?.name}. We've saved them as a beneficiary.
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

        <BankPickerSheet
          open={bankPickerOpen}
          onClose={() => setBankPickerOpen(false)}
          onPick={(b) => { setBank(b); setBankPickerOpen(false); }}
        />

        <ReviewSheet
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          onConfirm={startPinStep}
          title="Confirm bank transfer"
          totalKobo={totalKobo}
          rows={[
            { label: 'To',       value: lookup.name },
            { label: 'Bank',     value: bank?.name  },
            { label: 'Account',  value: accountNumber },
            { label: 'Amount',   value: formatNaira(amountKobo / 100, { decimals: 2 }) },
            { label: 'Fee',      value: feeKobo === 0 ? 'Free' : formatNaira(feeKobo / 100, { decimals: 2 }) },
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

function WalletChip({ walletKobo }) {
  return (
    <div className={styles.wallet}>
      <span>Available balance</span>
      <strong>{formatNaira(walletKobo / 100, { decimals: 2 })}</strong>
    </div>
  );
}

function SuccessMedallion() {
  return (
    <div className={styles.medallion} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 L9 17 L4 12" />
      </svg>
    </div>
  );
}

function friendly(err) {
  return err?.response?.data?.error?.message
    || err?.response?.data?.error?.details?.map((d) => d.message).join(' · ')
    || err?.message
    || 'Something went wrong';
}
