import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import ConfirmModal from '../components/ConfirmModal';
import { createGroup } from '../services/groups';
import { formatNaira } from '../utils/format';
import styles from './CreateGroup.module.css';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    targetAmountNaira: '',
    individualContributionNaira: '',
    contributionFrequency: 'monthly',
    targetDate: '',
    rules: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleSend(e) {
    e.preventDefault();
    setError('');
    const target = Number(form.targetAmountNaira);
    if (!form.name.trim()) return setError('Give your group a name');
    if (!(target > 0)) return setError('Target must be positive');
    if (!form.targetDate) return setError('Pick a target date');
    if (new Date(form.targetDate) <= new Date()) return setError('Target date must be in the future');
    setConfirmOpen(true);
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const group = await createGroup({
        name: form.name.trim(),
        description: form.description.trim(),
        targetAmountNaira: Number(form.targetAmountNaira),
        individualContributionNaira: Number(form.individualContributionNaira) || 0,
        contributionFrequency: form.contributionFrequency,
        targetDate: form.targetDate,
        rules: form.rules.trim(),
      });
      setCreated(group);
      setConfirmOpen(false);
      setStep('success');
    } catch (err) {
      setError(friendlyError(err));
    } finally { setSubmitting(false); }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(created.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Create Group" to="/my-jara" />

      {step === 'form' && (
        <form className={styles.form} onSubmit={handleSend} noValidate>
          <Field label="Group Name">
            <input className={styles.input} placeholder="Enter Group Name"
              value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={80} required />
          </Field>
          <Field label="Target Amount (₦)">
            <input className={styles.input} type="number" min="1" step="1"
              placeholder="Enter Amount"
              value={form.targetAmountNaira}
              onChange={(e) => set('targetAmountNaira', e.target.value)} required />
          </Field>
          <Field label="Contribution Frequency">
            <select className={styles.select}
              value={form.contributionFrequency}
              onChange={(e) => set('contributionFrequency', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual</option>
            </select>
          </Field>
          <Field label="Target Date">
            <input className={styles.input} type="date"
              value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} required />
          </Field>
          <Field label="Individual Contribution Amount (optional)">
            <input className={styles.input} type="number" min="0" step="1"
              placeholder="Enter Amount"
              value={form.individualContributionNaira}
              onChange={(e) => set('individualContributionNaira', e.target.value)} />
          </Field>
          <Field label="Set Group Rules (Optional)">
            <textarea className={styles.textarea} rows={3} maxLength={500}
              placeholder="Set expectations for members"
              value={form.rules} onChange={(e) => set('rules', e.target.value)} />
          </Field>

          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.submit}>Create Goal</button>
        </form>
      )}

      {step === 'success' && created && (
        <div className={styles.successCard}>
          <div className={styles.medal}><Check size={22} /></div>
          <h2 className={styles.successTitle}>Congratulations</h2>
          <p className={styles.successBody}>
            Group Created Successfully! Invitees will be notified to join your group.
          </p>
          <div className={styles.inviteBox}>
            <span className={styles.inviteLabel}>Invite Code</span>
            <div className={styles.inviteRow}>
              <span className={styles.inviteCode}>{created.inviteCode}</span>
              <button type="button" className={styles.copyBtn} onClick={copyCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <button type="button" className={styles.submit}
            onClick={() => navigate(`/groups/${created._id}`, { replace: true })}>
            View Group Dashboard
          </button>
          <button type="button" className={styles.cancel}
            onClick={() => navigate('/my-jara', { replace: true })}>
            Go Back To My Jara
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Group Details"
        rows={[
          { label: 'Group Name', value: form.name },
          { label: 'Target Amount', value: formatNaira(Number(form.targetAmountNaira), { decimals: 2 }) },
          { label: 'Frequency', value: cap(form.contributionFrequency) },
          { label: 'Target Date', value: form.targetDate },
        ]}
        ctaLabel="Confirm"
        onConfirm={handleCreate}
        onCancel={() => setConfirmOpen(false)}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}

function Field({ label, children }) {
  return <div className={styles.field}><label>{label}</label>{children}</div>;
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
