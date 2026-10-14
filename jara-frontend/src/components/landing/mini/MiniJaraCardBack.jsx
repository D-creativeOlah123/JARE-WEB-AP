import styles from './MiniJaraCardBack.module.css';

/**
 * MiniJaraCardBack — pure-CSS back face of the marketing Jara card.
 *
 * Mirrors the dimensions / radius of `MiniJaraCard` so CardFlip can
 * cleanly flip between the two faces.
 *
 * No real security details ever appear — the CVV is dots, the signature
 * is lorem-shaped scribble as decoration.
 */
export default function MiniJaraCardBack({ className = '' }) {
  return (
    <div className={`${styles.card} ${className}`} aria-hidden="true">
      {/* Magnetic strip */}
      <div className={styles.magStripe} />

      {/* Signature + CVV strip */}
      <div className={styles.sigRow}>
        <div className={styles.signature}>
          <svg viewBox="0 0 180 24" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 2 16 Q 10 4 18 14 T 36 14 T 54 10 T 72 16 T 94 8 T 118 14 T 142 10 T 170 14"
              fill="none"
              stroke="#1a0b2e"
              strokeOpacity="0.72"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className={styles.cvv}>
          <span className={styles.cvvLabel}>CVV</span>
          <span className={styles.cvvValue}>•••</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.disclaimer}>
          This card is property of Jara. Use subject to the Jara terms. For support,
          open the app → Profile → Support.
        </span>
      </div>
    </div>
  );
}
