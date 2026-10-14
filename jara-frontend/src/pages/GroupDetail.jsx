import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, Copy, Plus, UserPlus, Users } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import PinDisplay from '../components/PinDisplay';
import MobileKeypad from '../components/MobileKeypad';
import ConfirmModal from '../components/ConfirmModal';
import SuccessSheet from '../components/SuccessSheet';
import { getGroup, contributeToGroup } from '../services/groups';
import { formatNaira } from '../utils/format';
import styles from './GroupDetail.module.css';

export default function GroupDetail() {
  const { id } = useParams();

  const [group, setGroup] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [amount, setAmount] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [step, setStep] = useState('form');    // form | pin | success
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  async function refresh() {
    try {
      const data = await getGroup(id);
      setGroup(data.group);
      setContributions(data.contributions);
    } catch (err) {
      setLoadError(err.response?.data?.error?.message || 'Failed to load group');
    } finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Something went wrong';
  }

  function handleAdd() {
    setError('');
    if (!(Number(amount) > 0)) { setError('Enter a positive amount'); return; }
    setAddOpen(false);
    setConfirmOpen(true);
  }

  function handleConfirm() { setConfirmOpen(false); setStep('pin'); }

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
      const res = await contributeToGroup(id, { amountNaira: Number(amount), pin: codeVal, source: 'wallet' });
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

  async function copyCode() {
    try { await navigator.clipboard.writeText(group.inviteCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  if (loading) return <p className={styles.status}>Loading group…</p>;
  if (loadError) return <p className={styles.errorBanner}>{loadError}</p>;

  const pct = Math.max(0, Math.min(100, (group.savedAmount / group.targetAmount) * 100));
  const isActive = group.status === 'active';

  return (
    <div className={styles.page}>
      <MobileHeader title="Group Dashboard" to="/my-jara" />

      {step === 'form' && (
        <>
          <section className={styles.summaryCard}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Office Contribution</span>
              <span className={styles.pooledBadge}>Pooled</span>
            </div>
            <div className={styles.summaryValues}>
              <div>
                <div className={styles.tiny}>Total Saved</div>
                <div className={styles.big}>{formatNaira(group.savedAmount / 100)}</div>
              </div>
              <div className={styles.right}>
                <div className={styles.tiny}>of {formatNaira(group.targetAmount / 100)} Target</div>
                <div className={styles.tinyRight}>Progress</div>
              </div>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.tiny}>{Math.round(pct)}% · {group.members.length} Members</div>
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} onClick={() => isActive && setAddOpen(true)}>
              <div className={styles.actionIcon}><Plus size={18} /></div>
              <span>Add</span>
            </button>
            <button type="button" className={styles.actionBtn} onClick={copyCode}>
              <div className={styles.actionIcon}>{copied ? <Check size={18} /> : <UserPlus size={18} />}</div>
              <span>{copied ? 'Copied' : 'Invite'}</span>
            </button>
            <button type="button" className={styles.actionBtn} onClick={() => setMembersOpen(true)}>
              <div className={styles.actionIcon}><Users size={18} /></div>
              <span>Members</span>
            </button>
          </div>

          <section className={styles.inviteCard}>
            <span className={styles.inviteLabel}>Invitation Code</span>
            <div className={styles.inviteRow}>
              <span className={styles.inviteCode}>{group.inviteCode}</span>
              <button type="button" className={styles.copyBtn} onClick={copyCode}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </section>

          <section className={styles.activityCard}>
            <div className={styles.activityHead}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
              <span className={styles.tiny}>{contributions.length} entries</span>
            </div>
            {contributions.length === 0 ? (
              <p className={styles.emptyHint}>Nothing to show yet.</p>
            ) : (
              <ul className={styles.list}>
                {contributions.map((c) => (
                  <li key={c._id} className={styles.rowItem}>
                    <div>
                      <div className={styles.rName}>{cap(c.source)} top-up</div>
                      <div className={styles.rRef}>{c.reference}</div>
                    </div>
                    <span className={styles.plus}>+{formatNaira(c.amount / 100)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
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
          title={result.completed ? 'Group Goal Reached!' : 'Congratulations'}
          subtitle={
            result.completed
              ? `The circle has fully funded "${group.name}".`
              : `Contribution added successfully.${result.capped ? ' (Capped to remaining.)' : ''}`
          }
          ctaLabel="Continue"
          onCta={() => setStep('form')}
        />
      )}

      {/* Add Contribution — floating panel with amount input */}
      {addOpen && (
        <div className={styles.floatingInput} onClick={() => setAddOpen(false)}>
          <div className={styles.floatingCard} onClick={(e) => e.stopPropagation()}>
            <p className={styles.floatingLabel}>Enter the amount you'd like to contribute to <strong>{group.name}</strong>.</p>
            <div className={styles.amountRow}>
              <span className={styles.n}>₦</span>
              <input
                type="number" min="1" step="1" placeholder="Enter Amount"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="button" className={styles.confirmBtn} onClick={handleAdd}>Confirm Contribution</button>
            <button type="button" className={styles.cancelBtn} onClick={() => setAddOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Members drawer */}
      {membersOpen && (
        <div className={styles.scrim} onClick={() => setMembersOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHead}>
              <h3 className={styles.sectionTitle}>Members</h3>
              <button className={styles.close} onClick={() => setMembersOpen(false)}>✕</button>
            </div>
            <ul className={styles.list}>
              {group.members.map((m) => (
                <li key={m.userId} className={styles.rowItem}>
                  <div className={styles.member}>
                    <div className={styles.avatar}>{m.fullName?.charAt(0)?.toUpperCase() || 'J'}</div>
                    <div>
                      <div className={styles.rName}>{m.fullName}</div>
                      <div className={styles.rRef}>joined {new Date(m.joinedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <span className={styles.plus}>{formatNaira(m.contributedAmount / 100)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Contribution"
        rows={[
          { label: 'Group', value: group.name },
          { label: 'Amount', value: formatNaira(Number(amount), { decimals: 2 }) },
        ]}
        ctaLabel="Confirm"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
