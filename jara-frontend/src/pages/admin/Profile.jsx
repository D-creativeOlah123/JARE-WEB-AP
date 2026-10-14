import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Mail, Phone, LogOut, User as UserIcon,
  Calendar, KeyRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './Profile.module.css';

/**
 * Admin's own profile inside the dark admin shell. Displays identity +
 * quick facts + sign-out. Editing goes through /profile/edit on the
 * customer surface for now — no separate admin-only edit UI.
 */
export default function AdminProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initial = (user?.fullName || 'A').charAt(0).toUpperCase();
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Your admin identity on Jara.</p>
      </header>

      {/* Identity card */}
      <section className={styles.identity}>
        <div className={styles.avatar}>{initial}</div>
        <div className={styles.identityText}>
          <div className={styles.name}>
            {user?.fullName}
            <span className={styles.adminBadge}>
              <ShieldCheck size={12} /> Admin
            </span>
          </div>
          <div className={styles.metaRow}>
            <span><Mail size={12} /> {user?.email}</span>
            <span><Phone size={12} /> {user?.phone}</span>
          </div>
          <div className={styles.joined}>
            <Calendar size={12} /> Joined {joined}
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className={styles.facts}>
        <FactTile icon={UserIcon} label="Role"       value={user?.role || 'admin'} />
        <FactTile icon={Mail}     label="Email"      value={user?.emailVerified ? 'Verified' : 'Not verified'} tone={user?.emailVerified ? 'ok' : 'warn'} />
        <FactTile icon={Phone}    label="Phone"      value={user?.phoneVerified ? 'Verified' : 'Not verified'} tone={user?.phoneVerified ? 'ok' : 'warn'} />
        <FactTile icon={KeyRound} label="Transfer PIN" value={user?.hasTransferPin ? 'Set' : 'Not set'} tone={user?.hasTransferPin ? 'ok' : 'warn'} />
      </section>

      {/* Actions */}
      <section className={styles.actions}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => navigate('/profile/edit')}
        >
          Edit profile
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => navigate('/profile/security')}
        >
          Change PIN / password
        </button>
        <button type="button" className={styles.dangerBtn} onClick={handleLogout}>
          <LogOut size={14} /> Sign out
        </button>
      </section>
    </div>
  );
}

function FactTile({ icon: Icon, label, value, tone }) {
  const toneClass =
    tone === 'ok'   ? styles.factOk :
    tone === 'warn' ? styles.factWarn :
    '';
  return (
    <div className={styles.fact}>
      <div className={styles.factIcon}><Icon size={14} /></div>
      <span className={styles.factLabel}>{label}</span>
      <span className={`${styles.factValue} ${toneClass}`}>{value}</span>
    </div>
  );
}
