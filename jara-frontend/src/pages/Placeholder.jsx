import styles from './Placeholder.module.css';

/**
 * Empty-state page used at every route we haven't built yet. Keeps the
 * router uniform — replace with the real page as each feature ships.
 */
export default function Placeholder({ title, subtitle, step }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {step && <p className={styles.step}>Coming in {step}</p>}
      </div>
    </div>
  );
}
