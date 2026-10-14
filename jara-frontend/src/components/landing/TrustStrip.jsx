import { ShieldCheck, Lock, Fingerprint, Zap, Landmark } from 'lucide-react';
import { trustStrip } from '../../data/landing';
import styles from './TrustStrip.module.css';

/**
 * TrustStrip — single horizontal row, 56px tall, light-band surface.
 *
 * Claims come from `data/landing.js → trustStrip`; regulatory ones are
 * flagged `todo: true` and listed in `CLAIMS_TO_CONFIRM.md`. We still
 * render the text; the flag is a build-time reminder for Olalekan.
 *
 * Deliberately text + glyph only. **No logos.**
 */

// One lucide glyph per claim position; order matches data/landing.js.
const ICONS = [Landmark, ShieldCheck, Lock, Fingerprint, Zap];

export default function TrustStrip() {
  return (
    <aside className={styles.strip} aria-label="Jara trust signals">
      <ul className={styles.list}>
        {trustStrip.map((item, i) => {
          const Icon = ICONS[i] || ShieldCheck;
          return (
            <li key={item.label} className={styles.item}>
              <Icon size={16} className={styles.icon} aria-hidden="true" />
              <span className={styles.label}>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
