import styles from './ProviderMark.module.css';

/**
 * ProviderMark — text wordmark + brand-colour swatch for a Nigerian
 * telco / disco / TV / education provider. **No real logos.**
 *
 *   <ProviderMark name="MTN" />
 *
 * The colour map is a landing/app shared constant; new providers can be
 * added here without touching components.
 */
const COLOURS = {
  MTN:        '#FFCC00',
  Airtel:     '#ED1C24',
  Glo:        '#52AE33',
  '9mobile':  '#1E6B41',
  IKEDC:      '#0E6C9A',
  EKEDC:      '#004B87',
  AEDC:       '#1E3A5F',
  DStv:       '#003399',
  GOtv:       '#E60012',
  Startimes:  '#FF6600',
  Showmax:    '#2E2E2E',
  WAEC:       '#0A4D2D',
  JAMB:       '#1E4D7B',
};

/**
 * @param {object} props
 * @param {string} props.name
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.labelHidden=false]  render only the colour swatch
 */
export default function ProviderMark({ name, size = 'md', labelHidden = false, className = '' }) {
  const colour = COLOURS[name] || '#9B5A91';
  const cls = `${styles.mark} ${styles[`s_${size}`]} ${className}`.trim();
  return (
    <span className={cls} role="img" aria-label={name}>
      <span className={styles.swatch} style={{ background: colour }} aria-hidden="true" />
      {!labelHidden && <span className={styles.label}>{name}</span>}
    </span>
  );
}
