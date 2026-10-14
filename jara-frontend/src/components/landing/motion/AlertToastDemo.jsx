import { useEffect, useRef, useState } from 'react';
import { ArrowDownLeft } from 'lucide-react';
import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import styles from './AlertToastDemo.module.css';

/**
 * AlertToastDemo — three alert toasts drop in sequentially, each with a
 * soft "haptic" scale pulse (1 → 1.03 → 1). After the sequence it holds
 * for a beat and replays once every 7s while in view.
 *
 * Reduced motion: all three toasts render immediately, no pulse.
 *
 * @param {object}  props
 * @param {Array<{title:string, detail:string}>} props.toasts
 */
export default function AlertToastDemo({ toasts }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.4, once: false });
  const [playId, setPlayId] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    if (reduced || !inView) return undefined;
    timer.current = window.setInterval(() => setPlayId((n) => n + 1), 7000);
    return () => window.clearInterval(timer.current);
  }, [reduced, inView]);

  return (
    <div ref={ref} className={styles.wrap} aria-label="Credit alerts stacking up" role="img">
      <div key={playId} className={styles.stack}>
        {toasts.map((t, i) => (
          <article
            key={`${t.title}-${i}`}
            className={styles.toast}
            style={reduced ? undefined : { '--toast-delay': `${i * 400}ms` }}
          >
            <div className={styles.icon}><ArrowDownLeft size={16} /></div>
            <div className={styles.body}>
              <span className={styles.title}>{t.title}</span>
              <span className={styles.detail}>{t.detail}</span>
            </div>
            <span className={styles.ok} aria-hidden="true" />
          </article>
        ))}
      </div>
    </div>
  );
}
