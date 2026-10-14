import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Monitor, Bell, ShieldCheck, LogOut, Trash2, Info,
} from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import Spinner from '../components/Spinner';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import styles from './Settings.module.css';

const THEMES = [
  { id: 'light',  label: 'Light',  icon: Sun     },
  { id: 'dark',   label: 'Dark',   icon: Moon    },
  { id: 'system', label: 'System', icon: Monitor },
];

const APP_VERSION = 'Jara v0.9 · MVP';

export default function Settings() {
  const { user, logout } = useAuth();
  const { pref, setTheme } = useTheme();
  const navigate = useNavigate();

  const [signingOut, setSigningOut] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [notifDeposits,  setNotifDeposits]  = useState(true);
  const [notifTransfers, setNotifTransfers] = useState(true);
  const [notifSecurity,  setNotifSecurity]  = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setSigningOut(false);
    }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Settings" to="/profile" />

      {/* Appearance ------------------------------------------------------- */}
      <section className={`${styles.card} animate-fadeSlide`}>
        <header className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Appearance</span>
          <span className={styles.sectionSub}>Choose how Jara looks.</span>
        </header>
        <div className={styles.themeRow}>
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`${styles.themeChip} ${pref === id ? styles.themeChipActive : ''} btn-lift`}
              onClick={() => setTheme(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications ---------------------------------------------------- */}
      <section className={`${styles.card} animate-fadeSlide animate-delay-1`}>
        <header className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Notifications</span>
          <span className={styles.sectionSub}>Control what shows up in your inbox.</span>
        </header>

        <ToggleRow
          icon={Bell}
          title="Deposits & credits"
          desc="Get told the moment money arrives in your wallet."
          on={notifDeposits}
          onToggle={() => setNotifDeposits((v) => !v)}
        />
        <ToggleRow
          icon={Bell}
          title="Transfers & payments"
          desc="Confirmations for outgoing transfers and bill payments."
          on={notifTransfers}
          onToggle={() => setNotifTransfers((v) => !v)}
        />
        <ToggleRow
          icon={ShieldCheck}
          title="Security alerts"
          desc="New device logins, PIN changes, password resets."
          on={notifSecurity}
          onToggle={() => setNotifSecurity((v) => !v)}
          locked
        />
        <ToggleRow
          icon={Bell}
          title="Product news & offers"
          desc="Occasional updates about new features."
          on={notifMarketing}
          onToggle={() => setNotifMarketing((v) => !v)}
          isLast
        />
        <p className={styles.hint}>
          Preferences save locally on this device. Backend sync coming soon.
        </p>
      </section>

      {/* About ------------------------------------------------------------ */}
      <section className={`${styles.card} animate-fadeSlide animate-delay-2`}>
        <header className={styles.sectionHead}>
          <span className={styles.sectionTitle}>About</span>
        </header>
        <div className={styles.aboutRow}>
          <Info size={14} />
          <span>{APP_VERSION}</span>
        </div>
        <div className={styles.aboutRow}>
          <span className={styles.aboutLabel}>Signed in as</span>
          <span className={styles.aboutValue}>{user?.email}</span>
        </div>
      </section>

      {/* Danger zone ------------------------------------------------------ */}
      <section className={`${styles.card} ${styles.danger} animate-fadeSlide animate-delay-3`}>
        <header className={styles.sectionHead}>
          <span className={styles.sectionTitle}>Account</span>
        </header>

        <button
          type="button"
          className={`${styles.rowBtn} btn-lift`}
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOut size={16} />
          <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
          {signingOut && <Spinner size={14} style={{ marginLeft: 'auto' }} />}
        </button>

        <button
          type="button"
          className={`${styles.rowBtn} ${styles.rowDanger} btn-lift`}
          onClick={() => setConfirmClose(true)}
        >
          <Trash2 size={16} />
          <span>Close my account</span>
        </button>
      </section>

      {confirmClose && (
        <div className={styles.scrim} onClick={() => setConfirmClose(false)}>
          <div className={`${styles.modal} animate-scaleIn`} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Close account</h3>
            <p className={styles.modalBody}>
              Closing your account is permanent. Please withdraw your wallet balance first,
              then open a support ticket so we can complete the closure.
            </p>
            <div className={styles.modalRow}>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setConfirmClose(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalPrimary}
                onClick={() => { setConfirmClose(false); navigate('/profile/support'); }}
              >
                Open a ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, title, desc, on, onToggle, locked, isLast }) {
  return (
    <div className={`${styles.toggleRow} ${isLast ? styles.toggleRowLast : ''}`}>
      <div className={styles.toggleIcon}><Icon size={16} /></div>
      <div className={styles.toggleText}>
        <span className={styles.toggleTitle}>{title}</span>
        <span className={styles.toggleDesc}>{desc}</span>
      </div>
      <button
        type="button"
        className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
        onClick={locked ? undefined : onToggle}
        disabled={locked}
        title={locked ? 'Security alerts are always on' : undefined}
        aria-label={`Toggle ${title}`}
      >
        <span className={styles.knob} />
      </button>
    </div>
  );
}
