import { WifiOff } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';
import styles from './OfflineBanner.module.css';

/**
 * OfflineBanner — slim banner that drops in at the top of a scroll
 * region when the browser goes offline. Hides itself when connectivity
 * returns.
 *
 * Place at the top of a layout; it uses position: sticky so it hovers
 * above the first content pane.
 */
export default function OfflineBanner({ className = '' }) {
  const online = useOnline();
  if (online) return null;
  return (
    <div className={`${styles.banner} ${className}`} role="status" aria-live="polite">
      <WifiOff size={14} aria-hidden="true" />
      <span>You're offline — showing what we last loaded.</span>
    </div>
  );
}
