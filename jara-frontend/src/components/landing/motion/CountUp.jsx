import { useCountUp } from '../../../hooks/useCountUp';
import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { formatNaira } from '../../../utils/format';

/**
 * CountUp — animated number that only starts when scrolled into view.
 *
 * Live value renders in `aria-live="off"` so screen readers never hear the
 * scramble. The final value is also present in a visually-hidden span so
 * assistive tech reports the real figure.
 *
 * @param {object}  props
 * @param {number}  props.to                     target value (naira, not kobo)
 * @param {number}  [props.from=0]
 * @param {number}  [props.duration=1400]
 * @param {boolean} [props.naira=false]          format with `formatNaira`
 * @param {number}  [props.decimals=0]           decimals when `naira` is true
 * @param {string}  [props.prefix='']            raw-mode prefix
 * @param {string}  [props.suffix='']            raw-mode suffix
 * @param {boolean} [props.triggerOnView=true]   gate on `useInView`
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1400,
  naira = false,
  decimals = 0,
  prefix = '',
  suffix = '',
  triggerOnView = true,
}) {
  const reduced = useReducedMotion();
  // We always observe. When `triggerOnView` is false, we ignore `inView` and
  // start immediately — this keeps the hook call order stable (no conditional
  // hooks) across renders.
  const [ref, inView] = useInView({ threshold: 0.35, once: true });
  const enabled = (!triggerOnView || inView) && !reduced;

  const value = useCountUp({ to, from, duration, enabled });

  const display = naira
    ? formatNaira(value, { decimals })
    : `${prefix}${Math.round(value).toLocaleString('en-NG')}${suffix}`;

  const final = naira
    ? formatNaira(to, { decimals })
    : `${prefix}${to.toLocaleString('en-NG')}${suffix}`;

  return (
    <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }} aria-live="off">
      <span aria-hidden="true">{display}</span>
      <span style={visuallyHidden}>{final}</span>
    </span>
  );
}

const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
