import { Link } from 'react-router-dom';
import {
  Phone, Wifi, Trophy, Receipt,
  Tv, Lightbulb, GraduationCap, ShoppingBag,
  Gift, CreditCard, Landmark, Ticket,
  Wallet, Layers, Flag, UserPlus,
} from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import styles from './AllServices.module.css';

/**
 * All Services grid — 4 columns × 4 rows of the full service catalogue.
 * Working tiles link to their wizard; not-yet-built ones fall through
 * to a placeholder route.
 */
const SERVICES = [
  { id: 'airtime',  label: 'Airtime',       icon: Phone,         to: '/airtime' },
  { id: 'data',     label: 'Data',          icon: Wifi,          to: '/data' },
  { id: 'betting',  label: 'Betting',       icon: Trophy,        to: '#soon' },
  { id: 'bills',    label: 'Bills',         icon: Receipt,       to: '#soon' },
  { id: 'tv',       label: 'TV',            icon: Tv,            to: '/tv' },
  { id: 'elec',     label: 'Electricity',   icon: Lightbulb,     to: '/electricity' },
  { id: 'school',   label: 'School',        icon: GraduationCap, to: '/education' },
  { id: 'shop',     label: 'Shopping',      icon: ShoppingBag,   to: '#soon' },
  { id: 'spin',     label: 'Spin & Win',    icon: Gift,          to: '#soon' },
  { id: 'card',     label: 'Add Card',      icon: CreditCard,    to: '/profile/cards' },
  { id: 'loan',     label: 'Loan',          icon: Landmark,      to: '#soon' },
  { id: 'tickets',  label: 'Tickets',       icon: Ticket,        to: '#soon' },
  { id: 'vcard',    label: 'Virtual card',  icon: Wallet,        to: '#soon' },
  { id: 'pcard',    label: 'Physical Card', icon: Layers,        to: '#soon' },
  { id: 'embassy',  label: 'Embassies',     icon: Flag,          to: '#soon' },
  { id: 'refer',    label: 'Refer & Earn',  icon: UserPlus,      to: '#soon' },
];

export default function AllServices() {
  return (
    <div className={styles.page}>
      <MobileHeader title="All Services" to="/dashboard" />

      <section className={styles.grid}>
        {SERVICES.map(({ id, label, icon: Icon, to }) => (
          <Link key={id} to={to} className={styles.tile}>
            <div className={styles.iconWrap}>
              <Icon size={20} />
            </div>
            <span className={styles.label}>{label}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
