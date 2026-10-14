import { useState } from 'react';
import { Fingerprint, ShieldCheck, Key, Lock, X } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import { changePassword, changeTransferPin } from '../services/auth';
import { useAuth } from '../hooks/useAuth';
import styles from './SecurityPin.module.css';

export default function SecurityPin() {
  const { user } = useAuth();
  const [biometric, setBiometric] = useState(false);
  const [twoFa, setTwoFa] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className={styles.page}>
      <MobileHeader title="Security & PIN" to="/profile" />

      <section className={styles.card}>
        <ToggleRow
          icon={Fingerprint}
          title="Biometric Login"
          subtitle="Use fingerprint or face ID"
          checked={biometric}
          onToggle={() => setBiometric((v) => !v)}
        />
        <ToggleRow
          icon={ShieldCheck}
          title="Two-Factor Authentication"
          subtitle="Add extra security layer"
          checked={twoFa}
          onToggle={() => setTwoFa((v) => !v)}
        />
      </section>

      <section className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={() => setPinOpen(true)}>
          <Key size={16} />
          Change Pin
        </button>
        <button type="button" className={styles.actionBtn} onClick={() => setPwOpen(true)}>
          <Lock size={16} />
          Change Password
        </button>
      </section>

      {pinOpen && (
        <ChangePinModal
          hasExistingPin={Boolean(user?.hasTransferPin)}
          onClose={() => setPinOpen(false)}
        />
      )}
      {pwOpen && (
        <ChangePasswordModal onClose={() => setPwOpen(false)} />
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, subtitle, checked, onToggle }) {
  return (
    <div className={styles.row}>
      <div className={styles.rowIcon}><Icon size={18} /></div>
      <div className={styles.rowText}>
        <span className={styles.rowTitle}>{title}</span>
        <span className={styles.rowSub}>{subtitle}</span>
      </div>
      <button
        type="button"
        className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
        onClick={onToggle}
        aria-label={`Toggle ${title}`}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Change PIN modal — old PIN → new PIN → confirm, uses MobileKeypad. */
/* ------------------------------------------------------------------ */
function ChangePinModal({ hasExistingPin, onClose }) {
  // Steps: current (skip when no existing PIN) → new → confirm → done
  const [step, setStep] = useState(hasExistingPin ? 'current' : 'new');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const active =
    step === 'current' ? { value: currentPin, setter: setCurrentPin, title: 'Enter current PIN' } :
    step === 'new'     ? { value: newPin,     setter: setNewPin,     title: 'Create new PIN' } :
    step === 'confirm' ? { value: confirmPin, setter: setConfirmPin, title: 'Confirm new PIN' } :
                         null;

  function handleKey(k) {
    if (!active) return;
    if (k === 'del') { active.setter((v) => v.slice(0, -1)); return; }
    active.setter((v) => {
      const next = (v + k).slice(0, 4);
      if (next.length === 4) setTimeout(() => advance(next), 60);
      return next;
    });
  }

  async function advance(fullVal) {
    if (step === 'current') { setStep('new'); return; }
    if (step === 'new')     { setStep('confirm'); return; }
    if (step === 'confirm') {
      if (fullVal !== newPin) {
        setError('New PINs do not match. Start over.');
        setNewPin(''); setConfirmPin(''); setStep('new');
        return;
      }
      setSubmitting(true);
      setError('');
      try {
        await changeTransferPin({
          currentPin: hasExistingPin ? currentPin : undefined,
          newPin,
        });
        setStep('done');
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Failed to change PIN');
        setCurrentPin(''); setNewPin(''); setConfirmPin('');
        setStep(hasExistingPin ? 'current' : 'new');
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {step === 'done' ? (
          <div className={styles.done}>
            <div className={styles.doneBadge}>✓</div>
            <h2 className={styles.modalTitle}>PIN updated</h2>
            <p className={styles.modalSub}>You'll use the new PIN for future transfers.</p>
            <button type="button" className={styles.modalPrimary} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h2 className={styles.modalTitle}>{active.title}</h2>
            <PinDisplay length={4} value={active.value} />
            {error && <div className={styles.modalError}>{error}</div>}
            {submitting && <p className={styles.modalHint}>Saving…</p>}
            <MobileKeypad onKey={handleKey} />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Change Password modal — current + new + confirm.                 */
/* ---------------------------------------------------------------- */
function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (next !== confirm) return setError('New passwords do not match');
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setDone(true);
    } catch (err) {
      const p = err.response?.data?.error;
      const msg = p?.details?.length
        ? p.details.map((d) => `${d.field}: ${d.message}`).join(' · ')
        : p?.message || 'Failed to change password';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {done ? (
          <div className={styles.done}>
            <div className={styles.doneBadge}>✓</div>
            <h2 className={styles.modalTitle}>Password updated</h2>
            <p className={styles.modalSub}>Use the new password next time you log in.</p>
            <button type="button" className={styles.modalPrimary} onClick={onClose}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.modalTitle}>Change Password</h2>

            <PwField label="Current password" show={show} value={current} onChange={setCurrent} />
            <PwField label="New password"     show={show} value={next}    onChange={setNext} />
            <PwField label="Confirm new password" show={show} value={confirm} onChange={setConfirm} />

            <label className={styles.showRow}>
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              <span>Show passwords</span>
            </label>

            {error && <div className={styles.modalError}>{error}</div>}

            <button type="submit" className={styles.modalPrimary}
              disabled={submitting || !current || !next || !confirm}>
              {submitting ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function PwField({ label, show, value, onChange }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete="new-password"
      />
    </div>
  );
}
