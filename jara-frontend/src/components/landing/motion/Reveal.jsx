import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import styles from './Reveal.module.css';

/**
 * Reveal — fades + slides children up when they scroll into view, once.
 *
 * Under `prefers-reduced-motion: reduce`, children render instantly with
 * no transform. Children are **always** rendered (never gated on inView)
 * so SSR/empty-JS visitors still see content.
 *
 * @param {object}      props
 * @param {React.ReactNode} props.children
 * @param {string}      [props.as='div']   wrapper tag
 * @param {number}      [props.delay=0]    stagger in ms
 * @param {string}      [props.className]
 */
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.2, once: true });

  const classes = [
    styles.reveal,
    (!reduced && inView) ? styles.on : '',
    reduced ? styles.reduced : '',
    className,
  ].filter(Boolean).join(' ');

  const style = (!reduced && delay) ? { transitionDelay: `${delay}ms` } : undefined;

  return (
    <Tag ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Tag>
  );
}
