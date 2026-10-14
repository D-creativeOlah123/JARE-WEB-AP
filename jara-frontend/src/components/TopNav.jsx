import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUnreadCount } from '../services/notifications';
import styles from './TopNav.module.css';

/**
 * Sticky top bar for every dashboard page. Search is presentational until
 * we build a search endpoint. Bell shows a real unread count that refreshes
 * on route changes so it stays in sync after a user reads notifications.
 */
export default function TopNav() {
  const { user } = useAuth();
  const location = useLocation();
  const initial = user?.fullName?.trim().charAt(0)?.toUpperCase() || 'U';
  const [unread, setUnread] = useState(0);

  // Re-fetch on every navigation — cheap request, keeps the badge honest.
  useEffect(() => {
    let cancelled = false;
    getUnreadCount()
      .then((n) => { if (!cancelled) setUnread(n); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [location.pathname]);

  return (
    <header className={styles.topNav}>
      <div className={styles.search}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search transactions, goals…"
          aria-label="Search"
        />
      </div>

      <div className={styles.right}>
        <Link to="/notifications" className={styles.bell} aria-label="Notifications">
          <Bell size={20} />
          {unread > 0 && (
            <span className={styles.badge}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <Link to="/profile" className={styles.profile}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.profileText}>
            <span className={styles.profileName}>{user?.fullName || 'User'}</span>
            <span className={styles.profileEmail}>{user?.email}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
