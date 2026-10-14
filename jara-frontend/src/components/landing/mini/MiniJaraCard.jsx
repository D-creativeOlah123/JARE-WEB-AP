import { Wifi } from 'lucide-react';
import styles from './MiniJaraCard.module.css';

/**
 * MiniJaraCard — pure-CSS marketing card face used in the hero and card
 * showcase. **Not** the real card UI; this is a replica so landing and app
 * can evolve independently.
 *
 * Props mirror the shape in `data/landing.js` → `card.face`.
 *
 * @param {object} [props]
 * @param {string} [props.bankName='JARA']
 * @param {string} [props.cardholder='CHINEDU OKORO']
 * @param {string} [props.number='•••• •••• •••• 4821']
 * @param {string} [props.valid='09 / 29']
 * @param {string} [props.network='Verve / Mastercard-ready']   text only — no logos
 * @param {string} [props.className]
 */
export default function MiniJaraCard({
  bankName = 'JARA',
  cardholder = 'CHINEDU OKORO',
  number = '•••• •••• •••• 4821',
  valid = '09 / 29',
  network = 'Verve / Mastercard-ready',
  className = '',
}) {
  return (
    <div className={`${styles.card} ${className}`} aria-hidden="true">
      {/* subtle procedural noise, inline SVG so no extra request */}
      <svg
        className={styles.noise}
        xmlns="http://www.w3.org/2000/svg"
        width="100%" height="100%"
        viewBox="0 0 240 150"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id="jcard-noise">
            <feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .25 0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#jcard-noise)" />
      </svg>

      <header className={styles.topRow}>
        <span className={styles.bank}>{bankName}</span>
        <Wifi size={16} className={styles.contactless} />
      </header>

      <div className={styles.chip} aria-hidden="true">
        {/* 4×3 contact grid, drawn with background grids */}
        <span className={styles.chipGrid} />
      </div>

      <div className={styles.number}>{number}</div>

      <footer className={styles.footer}>
        <div className={styles.footerCol}>
          <span className={styles.footerLabel}>Cardholder</span>
          <span className={styles.footerValue}>{cardholder}</span>
        </div>
        <div className={styles.footerCol}>
          <span className={styles.footerLabel}>Valid thru</span>
          <span className={styles.footerValue}>{valid}</span>
        </div>
        <div className={styles.networkCol}>
          <span className={styles.network}>{network}</span>
        </div>
      </footer>
    </div>
  );
}
