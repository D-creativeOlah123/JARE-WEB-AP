import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { createGoal } from '../services/goals';
import { formatNaira } from '../utils/format';
import styles from './CreateGoal.module.css';

export default function CreateGoal() {
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    goalType: 'personal',
    name: '',
    category: '',
    targetAmountNaira: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    savingFrequency: 'weekly',
    paymentMethod: 'wallet',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdGoal, setCreatedGoal] = useState(null);

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
    if (!form.name.trim()) return setError('Give your goal a name');
    if (!(target > 0)) return setError('Target must be positive');
    if (!form.endDate) return setError('Pick an end date');
    if (new Date(form.endDate) <= new Date(form.startDate)) return setError('End date must be after start date');
    setConfirmOpen(true);
  }

  async function handleCreate() {
    setSubmitting(true);
    setError('');
    try {
      const goal = await createGoal({
        name: form.name.trim(),
        category: form.category.trim(),
        targetAmountNaira: Number(form.targetAmountNaira),
        startDate: form.startDate,
        endDate: form.endDate,
        savingFrequency: form.savingFrequency,
        paymentMethod: form.paymentMethod,
      });
      setCreatedGoal(goal);
      setConfirmOpen(false);
      setStep('success');
    } catch (err) {
      setError(friendlyError(err));
    } finally { setSubmitting(false); }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Create Goal" to="/my-jara" />

      {step === 'form' && (
        <form className={styles.form} onSubmit={handleSend} noValidate>
          <div className={styles.typeTabs}>
            <button type="button"
              className={`${styles.typeTab} ${form.goalType === 'personal' ? styles.typeTabActive : ''}`}
              onClick={() => set('goalType', 'personal')}>Personal</button>
            <button type="button" className={styles.typeTab} disabled
              title="Group goals — use Create Group instead">Group</button>
          </div>

          <Field label="Goal Name">
            <input className={styles.input} type="text"
              placeholder="What are you saving for?"
              value={form.name} onChange={(e) => set('name', e.target.value)}
              maxLength={80} required />
          </Field>

          <Field label="Target Amount (₦)">
            <input className={styles.input} type="number" min="1" step="1"
              placeholder="Enter Amount"
              value={form.targetAmountNaira}
              onChange={(e) => set('targetAmountNaira', e.target.value)} required />
          </Field>

          <Field label="Saving Plan">
            <select className={styles.select}
              value={form.savingFrequency}
              onChange={(e) => set('savingFrequency', e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="manual">Manual</option>
            </select>
          </Field>

          <Field label="Starting Date">
            <input className={styles.input} type="date"
              value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>

          <Field label="Ending Date">
            <input className={styles.input} type="date"
              value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </Field>

          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.submit}>Create Goal</button>
        </form>
      )}

      {step === 'success' && createdGoal && (
        <SuccessSheet
          title="Congratulations"
          subtitle="Goal Created Successfully! You're one step closer to reaching your goal."
          ctaLabel="Start Saving Now"
          onCta={() => navigate(`/my-jara/${createdGoal._id}`, { replace: true })}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Goal Details"
        rows={[
          { label: 'Goal Name', value: form.name },
          { label: 'Target Amount', value: formatNaira(Number(form.targetAmountNaira), { decimals: 2 }) },
          { label: 'Savings Plan', value: cap(form.savingFrequency) },
          { label: 'Starting Date', value: form.startDate },
          { label: 'Ending Date', value: form.endDate },
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
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {children}
    </div>
  );
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
