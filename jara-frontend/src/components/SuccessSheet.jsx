import { Star } from 'lucide-react';
import styles from './SuccessSheet.module.css';

/**
 * The magenta medallion + 5 stars + title + subtitle + CTA screen used
 * across the app (transfer success, account created, password changed…).
 *
 * Props:
 *   title      — big heading
 *   subtitle   — one-line description
 *   ctaLabel   — button text (default: "Continue")
 *   onCta      — click handler
 *   disabled   — button disabled
 */
export default function SuccessSheet({
  title = 'Congratulations',
  subtitle,
  ctaLabel = 'Continue',
  onCta,
  disabled = false,
  children,
}) {
  return (
    <div className={styles.wrap}>
      <div className={styles.medallion} aria-hidden />
      <div className={styles.stars} aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
        ))}
      </div>

      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

      {children}

      <button
        type="button"
        className={styles.cta}
        onClick={onCta}
        disabled={disabled}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
