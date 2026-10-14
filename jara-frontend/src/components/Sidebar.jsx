import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

/**
 * Desktop-only sidebar. Hidden below 1024px (see the CSS module).
 * `items` comes from DashboardLayout so both nav surfaces stay in sync.
 */
export default function Sidebar({ items }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
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
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <Icon size={20} />
            <span className={styles.navLabel}>{label}</span>
            {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
          }
        >
          <Settings size={20} />
          <span className={styles.navLabel}>Settings</span>
        </NavLink>
        <button className={styles.navItem} onClick={handleLogout} type="button">
          <LogOut size={20} />
          <span className={styles.navLabel}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
