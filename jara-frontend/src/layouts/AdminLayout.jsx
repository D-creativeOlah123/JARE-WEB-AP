import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/admin/Sidebar';
import Topbar from '../components/admin/Topbar';
import styles from './AdminLayout.module.css';

/**
 * Admin shell: fixed left sidebar (desktop-only) + sticky top bar + scrollable
 * content area. Dark violet backdrop with soft radial gradient.
 * Each admin route renders inside the <Outlet />.
 */
export default function AdminLayout() {
  const location = useLocation();
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div key={location.pathname} className={`${styles.content} route-transition`}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
