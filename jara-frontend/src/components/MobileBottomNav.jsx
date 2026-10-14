import { NavLink } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';

/**
 * Purple pill bottom navigation. 5 items. Active item renders as a
 * white pill with purple icon + label; the other four are white icons
 * on the purple pill.
 */
export default function MobileBottomNav({ tabs }) {
  return (
    <nav className={styles.bottomNav}>
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `${styles.tab} ${isActive ? styles.tabActive : ''}`
          }
        >
          <Icon size={18} />
          <span className={styles.tabLabel}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
