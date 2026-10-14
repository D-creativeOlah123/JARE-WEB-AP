import { Link } from 'react-router-dom';
import {
  Send, Phone, Wifi, Lightbulb, Tv, GraduationCap, Wallet, Grid3x3,
} from 'lucide-react';
import styles from './QuickActions.module.css';

/**
 * QuickActions — 8-tile shortcut grid.
 *
 * Each tile has its own accent colour so the row scans fast; icons from
 * lucide. Grid is 4 columns on wide phone frames, 4 on narrow (the whole
 * strip stays horizontal).
 */
const ACTIONS = [
  { id: 'send',        label: 'Send',        icon: Send,          to: '/transfer',    accent: 'brand' },
  { id: 'airtime',     label: 'Airtime',     icon: Phone,         to: '/airtime',     accent: 'mtn' },
  { id: 'data',        label: 'Data',        icon: Wifi,          to: '/data',        accent: 'glo' },
  { id: 'electricity', label: 'Electricity', icon: Lightbulb,     to: '/electricity', accent: 'warn' },
  { id: 'tv',          label: 'TV',          icon: Tv,            to: '/tv',          accent: 'info' },
  { id: 'education',   label: 'Education',   icon: GraduationCap, to: '/education',   accent: 'success' },
  { id: 'withdraw',    label: 'Withdraw',    icon: Wallet,        to: '/withdraw',    accent: 'danger' },
  { id: 'more',        label: 'More',        icon: Grid3x3,       to: '/services',    accent: 'neutral' },
];

export default function QuickActions() {
  return (
    <section className={styles.grid} aria-label="Quick actions">
      {ACTIONS.map(({ id, label, icon: Icon, to, accent }, i) => (
        <Link
          key={id}
          to={to}
          className={`${styles.action} ${styles[`accent_${accent}`]} btn-lift animate-scaleIn`}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <span className={styles.iconWrap}>
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className={styles.label}>{label}</span>
        </Link>
      ))}
    </section>
  );
}
