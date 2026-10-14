import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — eases a numeric value from `from` to `to` over `duration`ms
 * using requestAnimationFrame. Pauses while the tab is hidden; snaps to
 * the final value when `enabled` is false (reduced motion / already seen).
 *
 * @param {object}  opts
 * @param {number}  opts.to                 target value
 * @param {number}  [opts.from=0]           start value
 * @param {number}  [opts.duration=1400]    total duration in ms
 * @param {boolean} [opts.enabled=true]     when false, returns `to` immediately
 * @param {(t:number)=>number} [opts.ease]  easing on t∈[0,1]; default ease-out cubic
 * @returns {number} the current animated value
 */
export function useCountUp({
  to,
  from = 0,
  duration = 1400,
  enabled = true,
  ease = (t) => 1 - Math.pow(1 - t, 3),
}) {
  const [value, setValue] = useState(enabled ? from : to);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!enabled) { setValue(to); return undefined; }
    if (typeof window === 'undefined') { setValue(to); return undefined; }

    // Pause while hidden; resume by restarting the clock.
    function startAnim() {
      startRef.current = performance.now();
      const run = (now) => {
        const t = Math.min(1, (now - startRef.current) / Math.max(1, duration));
        setValue(from + (to - from) * ease(t));
        if (t < 1 && document.visibilityState !== 'hidden') {
          rafRef.current = requestAnimationFrame(run);
        } else if (document.visibilityState === 'hidden') {
          setValue(to);
        }
      };
      rafRef.current = requestAnimationFrame(run);
    }

    startAnim();

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(rafRef.current);
        setValue(to);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [to, from, duration, enabled, ease]);

  return value;
}
