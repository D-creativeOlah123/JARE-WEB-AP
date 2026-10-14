import { useEffect, useState } from 'react';
import { Save, ChevronRight } from 'lucide-react';
import { getPlatformSettings, updatePlatformSettings } from '../../services/admin';
import styles from './Settings.module.css';

const FEATURE_FLAGS = [
  { id: 'jaraTransfer',  label: 'Jara-to-Jara Transfers',         desc: 'Allow customers to send money to other Jara accounts.' },
  { id: 'bankTransfer',  label: 'Bank Transfers',                 desc: 'Allow outbound transfers to Nigerian bank accounts (Paystack).' },
  { id: 'airtime',       label: 'Airtime Purchases',              desc: 'Allow customers to buy airtime via VTPass.' },
  { id: 'data',          label: 'Data Purchases',                 desc: 'Allow customers to buy data plans via VTPass.' },
  { id: 'signups',       label: 'New Signups',                    desc: 'Turn off to freeze new account creation temporarily.' },
  { id: 'devPromote',    label: 'Dev promote (admin bootstrap)',  desc: 'Purely diagnostic — the endpoint is gated on !NODE_ENV=production.' },
];

const NUMERIC_LIMITS = [
  { id: 'minTransferNaira',   label: 'Minimum transfer (₦)' },
  { id: 'maxTransferNaira',   label: 'Maximum transfer (₦)' },
  { id: 'minGoalTargetNaira', label: 'Minimum goal target (₦)' },
  { id: 'otpTtlMinutes',      label: 'OTP validity (minutes)' },
];

const INTEGRATIONS = [
  { id: 'paystack', label: 'Paystack', hint: 'Bank transfers + card provisioning' },
  { id: 'vtpass',   label: 'VTPass',   hint: 'Airtime, data, bills' },
  { id: 'smtp',     label: 'SMTP',     hint: 'Transactional emails' },
];

export default function AdminSettings() {
  const [flags, setFlags]   = useState({});
  const [limits, setLimits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    getPlatformSettings()
      .then((s) => { setFlags(s.flags || {}); setLimits(s.limits || {}); })
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id) { setFlags((f) => ({ ...f, [id]: !f[id] })); }
  function setLimit(id, v) { setLimits((l) => ({ ...l, [id]: Number(v) })); }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const s = await updatePlatformSettings({ flags, limits });
      setFlags(s.flags || {});
      setLimits(s.limits || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className={styles.status}>Loading settings…</p>;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>Platform Settings</h1>
          <p className={styles.subtitle}>Feature flags, limits, and integration status.</p>
        </div>
        <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          <Save size={14} />
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Feature Flags</h2>
        <div className={styles.list}>
          {FEATURE_FLAGS.map((f) => (
            <div key={f.id} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowTitle}>{f.label}</span>
                <span className={styles.rowSub}>{f.desc}</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${flags[f.id] ? styles.toggleOn : ''}`}
                onClick={() => toggle(f.id)}
                aria-label={`Toggle ${f.label}`}
              >
                <span className={styles.knob} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Limits</h2>
        <div className={styles.grid}>
          {NUMERIC_LIMITS.map((f) => (
            <div key={f.id} className={styles.field}>
              <label>{f.label}</label>
              <input
                type="number"
                value={limits[f.id] ?? 0}
                onChange={(e) => setLimit(f.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Integrations</h2>
        <div className={styles.list}>
          {INTEGRATIONS.map((i) => (
            <div key={i.id} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowTitle}>{i.label}</span>
                <span className={styles.rowSub}>{i.hint}</span>
              </div>
              <ChevronRight size={16} className={styles.chev} />
            </div>
          ))}
        </div>
        <p className={styles.footHint}>
          Keys live in <code>.env</code> for now. A future step will surface them
          here with masked reveal + rotate.
        </p>
      </section>
    </div>
  );
}
