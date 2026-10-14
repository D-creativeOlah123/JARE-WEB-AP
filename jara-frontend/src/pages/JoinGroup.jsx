import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MobileHeader from '../components/MobileHeader';
import ConfirmModal from '../components/ConfirmModal';
import { lookupGroup, joinGroup } from '../services/groups';
import { formatNaira } from '../utils/format';
import styles from './JoinGroup.module.css';

export default function JoinGroup() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [preview, setPreview] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (code.length !== 7) { setPreview(null); setLookupError(''); return; }
    let cancelled = false;
    setLookingUp(true);
    setLookupError('');
    lookupGroup(code)
      .then((g) => { if (!cancelled) setPreview(g); })
      .catch((err) => {
        if (cancelled) return;
        setPreview(null);
        setLookupError(err.response?.data?.error?.message || 'Group not found');
      })
      .finally(() => { if (!cancelled) setLookingUp(false); });
    return () => { cancelled = true; };
  }, [code]);

  async function handleJoin() {
    setError('');
    setJoining(true);
    try {
      const group = await joinGroup(code);
      setConfirmOpen(false);
      navigate(`/groups/${group._id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to join');
    } finally { setJoining(false); }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Join a Group" to="/my-jara" />

      <div className={styles.card}>
        <p className={styles.helper}>Enter a group code or accept an invite to start saving together.</p>
        <label className={styles.label}>Enter Group Code</label>
        <div className={styles.codeRow}>
          <input
            className={styles.codeInput}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
            placeholder="Enter code"
            maxLength={7}
          />
          <button
            type="button"
            className={styles.findBtn}
            disabled={!preview || preview.status !== 'active'}
            onClick={() => setConfirmOpen(true)}
          >
            Find Group
          </button>
        </div>

        {lookingUp && <p className={styles.hint}>Looking up…</p>}
        {lookupError && <p className={styles.hintError}>{lookupError}</p>}
      </div>

      {preview && (
        <div className={styles.card}>
          <h2 className={styles.previewTitle}>Group Details</h2>
          <div className={styles.previewBlock}>
            <h3 className={styles.previewName}>{preview.name}</h3>
            {preview.description && <p className={styles.previewDesc}>{preview.description}</p>}
            <PreviewRow label="Target Amount" value={formatNaira(preview.targetAmount / 100, { decimals: 2 })} />
            <PreviewRow label="Contribution Frequency" value={cap(preview.contributionFrequency)} />
            <PreviewRow label="Target Date" value={new Date(preview.targetDate).toISOString().slice(0, 10)} />
            <PreviewRow label="Members" value={preview.memberCount} />
            <PreviewRow label="Individual Contribution" value={formatNaira(preview.individualContribution / 100)} />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="button" className={styles.joinBtn} onClick={() => setConfirmOpen(true)} disabled={preview.status !== 'active'}>
            {preview.status === 'active' ? 'Join Group' : 'Group is closed'}
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Join Request"
        rows={[
          { label: 'You are about to join', value: preview?.name || '—' },
          { label: 'Contribution', value: formatNaira((preview?.individualContribution || 0) / 100) + ' ' + cap(preview?.contributionFrequency || '') },
        ]}
        ctaLabel="Confirm"
        onConfirm={handleJoin}
        onCancel={() => setConfirmOpen(false)}
        submitting={joining}
      />
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className={styles.previewRow}>
      <span className={styles.pLabel}>{label}</span>
      <span className={styles.pValue}>{value}</span>
    </div>
  );
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
