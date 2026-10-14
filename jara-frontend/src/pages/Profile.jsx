import { Link, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronRight, CreditCard, HeadphonesIcon,
  LogOut, Moon, Pencil, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const { mode, setTheme } = useTheme();
  const navigate = useNavigate();
  const dark = mode === 'dark';
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Manage your account, preferences, and security.</p>
      </header>

      {/* Profile summary card */}
      <section className={styles.card}>
        <div className={styles.userRow}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar}>{initial}</div>
          )}
          <div className={styles.userText}>
            <span className={styles.userName}>{user?.fullName}</span>
            <span className={styles.userEmail}>{user?.email}</span>
            <span className={styles.since}>Member since {memberSince}</span>
          </div>
        </div>
        <Link to="/profile/edit" className={styles.editBtn}>
          <Pencil size={14} />
          Edit Profile
        </Link>
      </section>

      {/* Settings list */}
      <section className={styles.list}>
        <Row to="/profile/security" icon={ShieldCheck} label="Security & PIN" />
        <Row to="/profile/cards" icon={CreditCard} label="Linked Cards" />
        <Row to="/profile/notifications" icon={Bell} label="Notifications" />
        <div className={styles.rowStatic}>
          <div className={styles.rowLeft}>
            <div className={styles.rowIcon}><Moon size={16} /></div>
            <span className={styles.rowLabel}>Dark Mode</span>
          </div>
          <button
            type="button"
            className={`${styles.toggle} ${dark ? styles.toggleOn : ''}`}
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label="Toggle dark mode"
          >
            <span className={styles.knob} />
          </button>
        </div>
        <Row to="/profile/support" icon={HeadphonesIcon} label="Support / Help Center" />
      </section>

      <button type="button" className={styles.signOutBtn} onClick={handleLogout}>
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}

function Row({ to, icon: Icon, label }) {
  return (
    <Link to={to} className={styles.row}>
      <div className={styles.rowLeft}>
        <div className={styles.rowIcon}><Icon size={16} /></div>
        <span className={styles.rowLabel}>{label}</span>
      </div>
      <ChevronRight size={16} className={styles.chev} />
    </Link>
  );
}
