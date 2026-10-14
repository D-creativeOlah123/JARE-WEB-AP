import styles from './PageHeader.module.css';

/**
 * PageHeader — admin-side header used above tables and detail views.
 *
 * The customer app keeps `MobileHeader` (phone-frame back arrow); this
 * component is deliberately desktop-shaped.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.actions]   buttons / filters right-aligned
 */
export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`${styles.wrap} ${className}`}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
