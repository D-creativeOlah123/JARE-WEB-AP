import { Outlet, useLocation } from 'react-router-dom';
import { Home, Send, ShieldCheck, BarChart2, User } from 'lucide-react';
import MobileBottomNav from '../components/MobileBottomNav';
import styles from './DashboardLayout.module.css';

const TABS = [
  { to: '/dashboard',        label: 'Home',     icon: Home,        end: true },
  { to: '/transfer',         label: 'Send',     icon: Send },
  { to: '/profile/security', label: 'Security', icon: ShieldCheck },
  { to: '/reports',          label: 'Analytics',icon: BarChart2 },
  { to: '/profile',          label: 'Profile',  icon: User,        end: true },
];

export default function DashboardLayout() {
  const location = useLocation();
  return (
    <div className={styles.stage}>
      <div className={styles.phone}>
        {/* key on pathname → new page mounts and replays the fadeSlide animation */}
        <div key={location.pathname} className={`${styles.screen} route-transition`}>
          <Outlet />
        </div>
        <MobileBottomNav tabs={TABS} />
        <div className={styles.gestureBar} />
      </div>
    </div>
  );
}
