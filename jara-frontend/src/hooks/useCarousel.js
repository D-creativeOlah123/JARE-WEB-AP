import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * useCarousel — accessible slide controller.
 *
 * Features:
 *   - autoplay (pauses on hover, focus-within, hidden tab, reduced motion)
 *   - swipe (horizontal) with threshold
 *   - arrow-left/right keyboard support when the carousel region owns focus
 *   - dots helpers (`isCurrent(i)`, `goTo(i)`)
 *   - returns a `regionProps` object with the right ARIA + handlers to spread
 *
 * @param {object} opts
 * @param {number} opts.count              total slides
 * @param {number} [opts.interval=6000]    autoplay interval
 * @param {boolean} [opts.autoplay=true]
 * @returns {{
 *   index: number,
 *   goTo: (i:number)=>void,
 *   next: ()=>void,
 *   prev: ()=>void,
 *   isCurrent: (i:number)=>boolean,
 *   paused: boolean,
 *   regionProps: object,
 * }}
 */
export function useCarousel({ count, interval = 6000, autoplay = true }) {
  const reduced = useReducedMotion();
  const [index, setIndex]   = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  const paused = !autoplay || reduced || hovered || focused || !visible;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const goTo = useCallback((i) => setIndex(((i % count) + count) % count), [count]);
  const isCurrent = useCallback((i) => i === index, [index]);

  // Autoplay tick.
  useEffect(() => {
    if (paused || count <= 1) return undefined;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [paused, next, interval, count]);

  // Visibility.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVis = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Swipe tracking.
  const touchStart = useRef(0);
  const onTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const dx = (e.changedTouches[0].clientX ?? 0) - touchStart.current;
    if (Math.abs(dx) < 36) return;
    if (dx < 0) next(); else prev();
  };

  // Keyboard.
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  const regionProps = {
    role: 'region',
    'aria-roledescription': 'carousel',
    tabIndex: 0,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur:  () => setFocused(false),
    onTouchStart,
    onTouchEnd,
    onKeyDown,
  };

  return { index, goTo, next, prev, isCurrent, paused, regionProps };
}
