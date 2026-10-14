import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, Landmark, Wallet } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import SuccessSheet from '../components/SuccessSheet';
import { getGoal, contributeToGoal } from '../services/goals';
import { formatNaira } from '../utils/format';
import styles from './GoalDetail.module.css';

export default function GoalDetail() {
  const { id } = useParams();

  const [goal, setGoal] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [method, setMethod] = useState('wallet');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form');    // form | pin | success
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function refresh() {
    try {
      const data = await getGoal(id);
      setGoal(data.goal);
      setContributions(data.contributions);
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || 'Failed to load goal');
    } finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleAdd(e) {
    e.preventDefault();
    setError('');
    const parsed = Number(amount);
    if (!(parsed > 0)) return setError('Enter a positive amount');
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
      const res = await contributeToGoal(id, {
        amountNaira: Number(amount), pin: codeVal, source: method,
      });
      setResult(res);
      await refresh();
      setAmount('');
      setPin('');
      setStep('success');
    } catch (err) {
      setError(friendlyError(err));
      setPin('');
    } finally { setSubmitting(false); }
  }

  if (loading) return <p className={styles.status}>Loading goal…</p>;
  if (loadError) return <p className={styles.errorBanner}>{loadError}</p>;

  const savedNaira  = goal.savedAmount  / 100;
  const targetNaira = goal.targetAmount / 100;
  const pct = Math.max(0, Math.min(100, (goal.savedAmount / goal.targetAmount) * 100));
  const isActive = goal.status === 'active';

  return (
    <div className={styles.page}>
      <MobileHeader title="Start Saving Now" to="/my-jara" />

      <section className={styles.progressCard}>
        <ProgressRing pct={pct} />
        <div className={styles.progressText}>
          <h2 className={styles.goalName}>{goal.name}</h2>
          <p className={styles.progressSub}>
            {formatNaira(savedNaira)} / {formatNaira(targetNaira)}
          </p>
          {goal.status === 'completed' && <span className={styles.doneBadge}>Completed</span>}
        </div>
      </section>

      {isActive && step === 'form' && (
        <>
          <div className={styles.methodRow}>
            <MethodTab active={method === 'wallet'} onClick={() => setMethod('wallet')} icon={Wallet} label="Wallet" />
            <MethodTab disabled icon={Landmark} label="Bank" />
            <MethodTab disabled icon={CreditCard} label="Card" />
          </div>

          <form onSubmit={handleAdd} className={styles.form}>
            <label className={styles.label}>Add to your goal</label>
            <div className={styles.amountRow}>
              <span className={styles.n}>₦</span>
              <input
                type="number" min="1" step="1"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={styles.submit} disabled={!amount}>Add Money</button>
          </form>
        </>
      )}

      {step === 'pin' && (
        <div className={styles.pinScreen}>
          <h2 className={styles.pinTitle}>Enter Transaction Pin</h2>
          <PinDisplay length={4} value={pin} />
          {error && <div className={styles.error}>{error}</div>}
          {submitting && <p className={styles.hint}>Saving…</p>}
          <MobileKeypad onKey={handleKey} />
        </div>
      )}

      {step === 'success' && result && (
        <SuccessSheet
          title={result.completed ? 'Goal Reached!' : 'Congratulations'}
          subtitle={
            result.completed
              ? `You just funded "${goal.name}" fully.`
              : `Amount added successfully.${result.capped ? ' (Capped to remaining.)' : ''}`
          }
          ctaLabel="Continue"
          onCta={() => setStep('form')}
        />
      )}

      <section className={styles.historyCard}>
        <h3 className={styles.historyTitle}>Recent Contributions</h3>
        {contributions.length === 0 ? (
          <p className={styles.emptyHint}>Nothing to show yet.</p>
        ) : (
          <ul className={styles.historyList}>
            {contributions.map((c) => (
              <li key={c._id} className={styles.historyRow}>
                <div>
                  <div className={styles.hSource}>{cap(c.source)} top-up</div>
                  <div className={styles.hRef}>{c.reference}</div>
                </div>
                <span className={styles.hAmount}>+{formatNaira(c.amount / 100)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MethodTab({ active, onClick, icon: Icon, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${styles.methodTab} ${active ? styles.methodActive : ''}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function ProgressRing({ pct, size = 80, stroke = 8 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r}
        stroke="var(--color-primary-soft)" strokeWidth={stroke} fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r}
        stroke="var(--color-primary)" strokeWidth={stroke} fill="none"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 500ms ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        fill="var(--color-primary)" fontSize="14" fontWeight="700">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
