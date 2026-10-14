import { useState } from 'react';
import { Bell, Mail, MessageSquareText, TrendingUp } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import styles from './NotificationPrefs.module.css';

const PREFS = [
  { id: 'push',        icon: Bell,               title: 'Push Notifications', sub: 'Receive app notifications' },
  { id: 'email',       icon: Mail,               title: 'Email Notifications', sub: 'Get updates via email' },
  { id: 'sms',         icon: MessageSquareText,  title: 'SMS Alerts',          sub: 'Transaction confirmations' },
  { id: 'milestones',  icon: TrendingUp,         title: 'Savings Milestones',  sub: 'Celebrate your achievements' },
];

export default function NotificationPrefs() {
  const [state, setState] = useState({ push: true, email: true, sms: false, milestones: true });

  function toggle(id) { setState((s) => ({ ...s, [id]: !s[id] })); }

  return (
    <div className={styles.page}>
      <MobileHeader title="Notifications" to="/profile" />

      <section className={styles.card}>
        {PREFS.map(({ id, icon: Icon, title, sub }) => (
          <div key={id} className={styles.row}>
            <div className={styles.rowIcon}><Icon size={18} /></div>
            <div className={styles.rowText}>
              <span className={styles.rowTitle}>{title}</span>
              <span className={styles.rowSub}>{sub}</span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${state[id] ? styles.toggleOn : ''}`}
              onClick={() => toggle(id)}
              aria-label={`Toggle ${title}`}
            >
              <span className={styles.knob} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
