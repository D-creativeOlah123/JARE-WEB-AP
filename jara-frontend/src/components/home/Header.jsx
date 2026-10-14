import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../../services/notifications';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import styles from './Header.module.css';

/**
 * Home header — greeting with the time-of-day, user avatar on the left,
 * notification bell with a live unread badge on the right.
 */
function greetingForHour(h) {
  if (h < 5)  return 'Still up,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Good night,';
}

function firstName(full) {
  return (full || '').trim().split(/\s+/)[0] || 'there';
}

export default function Header() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [greet, setGreet]   = useState(greetingForHour(new Date().getHours()));

  // Refresh the greeting every minute so it stays accurate across the day.
  useEffect(() => {
    const id = setInterval(() => setGreet(greetingForHour(new Date().getHours())), 60_000);
    return () => clearInterval(id);
  }, []);

  // Load unread notifications count.
  useEffect(() => {
    let cancelled = false;
    getUnreadCount()
      .then((n) => { if (!cancelled) setUnread(Number.isFinite(n) ? n : 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <header className={styles.header}>
      <Link to="/profile" aria-label="Your profile" className={styles.identity}>
        <Avatar name={user?.fullName || 'Jara'} src={user?.avatar} size="md" />
        <div className={styles.text}>
          <span className={styles.greet}>{greet}</span>
          <span className={styles.name}>{firstName(user?.fullName)}</span>
        </div>
      </Link>

      <Link to="/notifications" className={styles.bell} aria-label={
        unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
      }>
        <Bell size={18} />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>
    </header>
  );
}
