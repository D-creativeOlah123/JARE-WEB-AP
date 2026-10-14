import { useEffect, useRef, useState } from 'react';

/**
 * useInView — fires true once an element crosses the threshold.
 *
 * @param {object}   [opts]
 * @param {number}   [opts.threshold=0.35]   fraction of the element in view before firing
 * @param {string}   [opts.rootMargin='0px'] IntersectionObserver rootMargin
 * @param {boolean}  [opts.once=true]        when true (default), the hook fires once and detaches
 * @returns {[React.RefObject<HTMLElement>, boolean]} [ref, inView]
 *
 * Caller attaches `ref` to the element it wants observed.
 * Honours `prefers-reduced-motion: reduce` indirectly — any animation that
 * reads `inView` should separately gate on `useReducedMotion()`.
 */
export function useInView({ threshold = 0.35, rootMargin = '0px', once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // No IntersectionObserver (e.g. jsdom) → treat as always in view so content still renders.
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInView(true);
      return undefined;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) io.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}
