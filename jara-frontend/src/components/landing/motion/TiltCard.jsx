import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import styles from './TiltCard.module.css';

/**
 * TiltCard — pointer-driven 3D tilt with a gloss highlight that follows
 * the pointer. Springs back on leave. Mobile and reduced-motion users
 * get a static card (no tilt, static gloss).
 *
 * This component only tilts; the 3D flip for front/back is `CardFlip`
 * (Phase 4).
 *
 * @param {object} props
 * @param {React.ReactNode} props.children  the surface to tilt (e.g. <MiniJaraCard />)
 * @param {number}  [props.max=12]          max rotation in degrees
 * @param {string}  [props.className]
 * @param {string}  [props.ariaLabel]       passed to the outer wrapper
 * @param {boolean} [props.focusable=true]  when false, the wrapper is not keyboard-
 *                                          focusable — pass false if the child is
 *                                          itself interactive (e.g. CardFlip owns
 *                                          Enter/Space to flip).
 */
export default function TiltCard({
  children,
  max = 12,
  className = '',
  ariaLabel,
  focusable = true,
}) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const rafRef = useRef(0);
  const [tiltOn, setTiltOn] = useState(false);
  const [vars, setVars] = useState({ x: '0deg', y: '0deg', gx: '50%', gy: '50%' });

  const update = useCallback((clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (clientX - rect.left) / rect.width;    // 0..1
    const dy = (clientY - rect.top)  / rect.height;   // 0..1
    const ry = (dx - 0.5) *  (max * 2);               // horizontal → rotateY
    const rx = (0.5 - dy) *  (max * 2);               // vertical   → rotateX
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setVars({
        x: `${rx.toFixed(2)}deg`,
        y: `${ry.toFixed(2)}deg`,
        gx: `${(dx * 100).toFixed(1)}%`,
        gy: `${(dy * 100).toFixed(1)}%`,
      });
    });
  }, [max]);

  if (reduced) {
    return (
      <div
        className={`${styles.wrap} ${styles.reduced} ${className}`}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
      >
        <div className={styles.surface}>{children}</div>
      </div>
    );
  }

  const onPointerMove = (e) => { setTiltOn(true); update(e.clientX, e.clientY); };
  const onPointerLeave = () => {
    cancelAnimationFrame(rafRef.current);
    setTiltOn(false);
    setVars({ x: '0deg', y: '0deg', gx: '50%', gy: '50%' });
  };
  const onFocus = () => setTiltOn(true);
  const onBlur  = onPointerLeave;

  return (
    <div
      ref={ref}
      className={`${styles.wrap} ${tiltOn ? styles.on : ''} ${className}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      tabIndex={focusable ? 0 : -1}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onFocus={focusable ? onFocus : undefined}
      onBlur={focusable ? onBlur : undefined}
      style={{
        '--tilt-x':  vars.x,
        '--tilt-y':  vars.y,
        '--gloss-x': vars.gx,
        '--gloss-y': vars.gy,
      }}
    >
      <div className={styles.surface}>
        {children}
        <span className={styles.gloss} aria-hidden="true" />
      </div>
    </div>
  );
}
