import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, UsersRound, Target, Users, Receipt, Bell, User,
  Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAdminModeration } from '../../services/admin';
import styles from './Sidebar.module.css';

const PRIMARY_ITEMS = [
  { to: '/admin',               label: 'Home',          icon: Home,       end: true },
  { to: '/admin/users',         label: 'Users',         icon: UsersRound },
  { to: '/admin/goals',         label: 'My Jara',       icon: Target,     badge: 3 },
  { to: '/admin/groups',        label: 'Groups',        icon: Users },
  { to: '/admin/transactions',  label: 'Transactions',  icon: Receipt },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell,       liveBadge: 'moderation' },
  { to: '/admin/profile',       label: 'Profile',       icon: User },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moderationCount, setModerationCount] = useState(null);

  // Refetch moderation summary on mount and on every admin navigation so the
  // badge stays in sync after the admin actions items in the queue.
  useEffect(() => {
    let cancelled = false;
    getAdminModeration({ limit: 1 })
      .then((res) => {
        if (cancelled) return;
        const s = res.summary || {};
        const total = (s.failedTransfers || 0)
                    + (s.failedServices  || 0)
                    + (s.staleTransfers  || 0)
                    + (s.staleServices   || 0);
        setModerationCount(total);
      })
      .catch(() => { /* leave badge hidden on failure */ });
    return () => { cancelled = true; };
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  function badgeFor(item) {
    if (item.liveBadge === 'moderation') return moderationCount;
    return item.badge;
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>J</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Jara</span>
          <span className={styles.brandSub}>Dashboard</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {PRIMARY_ITEMS.map((item) => {
          const { to, label, icon: Icon, end } = item;
          const badge = badgeFor(item);
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              <Icon size={18} />
              <span className={styles.navLabel}>{label}</span>
              {badge > 0 && (
                <span className={styles.navBadge}>{badge > 99 ? '99+' : badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/admin/settings" className={styles.footerItem}>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <button type="button" className={styles.footerItem} onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
