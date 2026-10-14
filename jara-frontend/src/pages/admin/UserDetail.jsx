import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, Mail, Phone, Wallet,
  Send, Target, Users, ShieldOff, ShieldAlert,
} from 'lucide-react';
import { getAdminUserDetail, patchAdminUser } from '../../services/admin';
import { formatNaira } from '../../utils/format';
import styles from './UserDetail.module.css';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');   // key of the field being saved

  async function refresh() {
    setLoading(true);
    try {
      setData(await getAdminUserDetail(id));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load user');
    } finally { setLoading(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePatch(key, value) {
    setSaving(key);
    try {
      await patchAdminUser(id, { [key]: value });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update');
    } finally { setSaving(''); }
  }

  if (loading) return <p className={styles.status}>Loading user…</p>;
  if (error)   return <p className={styles.error}>{error}</p>;
  if (!data)   return null;

  const { user, account, counts } = data;
  const initial = (user.fullName || '?').charAt(0).toUpperCase();
  const joined = new Date(user.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const isAdmin = user.role === 'admin';
  const isSuspended = Boolean(user.suspended);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/admin/users" className={styles.back} aria-label="Back to users">
          <ArrowLeft size={18} />
        </Link>
        <h1 className={styles.title}>User Details</h1>
      </header>

      {/* Identity card */}
      <section className={styles.identity}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.identityText}>
          <div className={styles.name}>
            {user.fullName}
            {isAdmin && (
              <span className={styles.adminBadge}>
                <ShieldCheck size={12} /> Admin
              </span>
            )}
            {isSuspended && (
              <span className={styles.suspendedBadge}>
                <ShieldAlert size={12} /> Suspended
              </span>
            )}
          </div>
          <div className={styles.metaRow}>
            <span><Mail size={12} /> {user.email}</span>
            <span><Phone size={12} /> {user.phone}</span>
          </div>
          <div className={styles.joined}>Joined {joined}</div>
          {user.bvnMasked && (
            <div className={styles.bvn}>BVN {user.bvnMasked}</div>
          )}
        </div>
      </section>

      {/* Wallet + counts */}
      <section className={styles.statGrid}>
        <StatTile
          icon={Wallet}
          label="Wallet Balance"
          value={account ? formatNaira(account.balance / 100, { decimals: 2 }) : '—'}
          hint={account ? `Acct ${account.accountNumber}` : 'No account'}
          color="linear-gradient(135deg, #EC4899, #A855F7)"
        />
        <StatTile
          icon={Send}
          label="Transfers"
          value={counts.transfers}
          hint="lifetime"
          color="linear-gradient(135deg, #3B82F6, #1E40AF)"
        />
        <StatTile
          icon={Target}
          label="Goals"
          value={counts.goals}
          hint="lifetime"
          color="linear-gradient(135deg, #10B981, #047857)"
        />
        <StatTile
          icon={Users}
          label="Groups"
          value={counts.groups}
          hint="member of"
          color="linear-gradient(135deg, #F97316, #C2410C)"
        />
      </section>

      {/* Actions */}
      <section className={styles.actions}>
        <h2 className={styles.sectionTitle}>Account Controls</h2>

        <ActionRow
          title="Role"
          subtitle={isAdmin
            ? 'This account can access every /admin/* route.'
            : 'Promote to give this user access to the admin dashboard.'}
          value={user.role}
          buttonLabel={isAdmin ? 'Demote to customer' : 'Promote to admin'}
          buttonKind={isAdmin ? 'danger' : 'primary'}
          onClick={() => handlePatch('role', isAdmin ? 'customer' : 'admin')}
          saving={saving === 'role'}
        />

        <ActionRow
          title="Email verified"
          subtitle="Manually confirm the email if the user has proven ownership out-of-band."
          value={user.emailVerified ? 'Verified' : 'Not verified'}
          buttonLabel={user.emailVerified ? 'Mark unverified' : 'Mark verified'}
          onClick={() => handlePatch('emailVerified', !user.emailVerified)}
          saving={saving === 'emailVerified'}
        />

        <ActionRow
          title="Phone verified"
          subtitle="Same as above, for the phone number on file."
          value={user.phoneVerified ? 'Verified' : 'Not verified'}
          buttonLabel={user.phoneVerified ? 'Mark unverified' : 'Mark verified'}
          onClick={() => handlePatch('phoneVerified', !user.phoneVerified)}
          saving={saving === 'phoneVerified'}
        />

        <ActionRow
          title="Suspension"
          subtitle="Suspended accounts stay data-intact but should be blocked from logging in (frontend flag only until we gate the auth layer)."
          value={isSuspended ? 'Suspended' : 'Active'}
          buttonLabel={isSuspended ? 'Unsuspend' : 'Suspend'}
          buttonKind={isSuspended ? 'primary' : 'danger'}
          buttonIcon={isSuspended ? ShieldCheck : ShieldOff}
          onClick={() => handlePatch('suspended', !isSuspended)}
          saving={saving === 'suspended'}
        />
      </section>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hint, color }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statIcon} style={{ background: color }}>
        <Icon size={16} color="white" />
      </div>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statHint}>{hint}</span>
    </div>
  );
}

function ActionRow({ title, subtitle, value, buttonLabel, buttonKind = 'ghost', buttonIcon: Icon, onClick, saving }) {
  const kindClass =
    buttonKind === 'primary' ? styles.btnPrimary :
    buttonKind === 'danger'  ? styles.btnDanger  :
    styles.btnGhost;
  return (
    <div className={styles.actionRow}>
      <div className={styles.actionText}>
        <span className={styles.actionTitle}>{title}</span>
        <span className={styles.actionSub}>{subtitle}</span>
        <span className={styles.actionValue}>{value}</span>
      </div>
      <button
        type="button"
        className={`${styles.actionBtn} ${kindClass}`}
        onClick={onClick}
        disabled={saving}
      >
        {Icon && <Icon size={14} />}
        {saving ? 'Saving…' : buttonLabel}
      </button>
    </div>
  );
}
