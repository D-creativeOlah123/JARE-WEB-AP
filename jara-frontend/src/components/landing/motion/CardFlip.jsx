import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import MiniJaraCard from '../mini/MiniJaraCard';
import MiniJaraCardBack from '../mini/MiniJaraCardBack';
import styles from './CardFlip.module.css';

/**
 * CardFlip — 3D front/back flip of the marketing Jara card.
 *
 *   - Click/tap, Enter or Space on the card itself toggles the flip.
 *   - A tiny "Flip" button (lower-right) also toggles for discoverability.
 *   - 600ms `rotateY(0→180deg)` with `preserve-3d`; backface hidden on both faces.
 *   - Reduced motion: opacity crossfade (150ms) instead of 3D flip.
 *
 * This component only owns the flip; wrap it in `<TiltCard focusable={false}>`
 * to add the pointer-driven tilt + gloss.
 *
 * @param {object} [props]
 * @param {boolean} [props.initialFlipped=false]
 * @param {string}  [props.className]
 */
export default function CardFlip({ initialFlipped = false, className = '' }) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(initialFlipped);
  const toggle = () => setFlipped((f) => !f);

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className={`${styles.wrap} ${className}`}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? 'Show card front' : 'Show card back'}
        onClick={toggle}
        onKeyDown={onKey}
        className={`
          ${styles.flipper}
          ${flipped ? styles.flipped : ''}
          ${reduced ? styles.reduced : ''}
        `}
      >
        <div className={`${styles.face} ${styles.front}`}>
          <MiniJaraCard />
        </div>
        <div className={`${styles.face} ${styles.back}`}>
          <MiniJaraCardBack />
        </div>
      </div>

      <button
        type="button"
        className={`${styles.flipBtn} btn-lift`}
        onClick={toggle}
        aria-label={flipped ? 'Show card front' : 'Show card back'}
      >
        <RefreshCw size={12} />
        Flip
      </button>
    </div>
  );
}
