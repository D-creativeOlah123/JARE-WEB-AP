import Skeleton from './Skeleton';
import styles from './PageSkeleton.module.css';

/**
 * PageSkeleton — Suspense fallback that mirrors the shape of a page
 * instead of a bare spinner. Variants roughly match our layouts.
 *
 *   <Suspense fallback={<PageSkeleton variant="customer" />}> … </Suspense>
 *
 * @param {object} props
 * @param {'customer'|'admin'|'auth'} [props.variant='customer']
 */
export default function PageSkeleton({ variant = 'customer' }) {
  return (
    <div className={`${styles.wrap} ${styles[variant]}`} aria-busy="true" aria-live="polite">
      <Skeleton width="60%" height={16} />
      <Skeleton width="90%" height={120} radius={16} />
      <div className={styles.row}>
        <Skeleton width="30%" height={60} radius={12} />
        <Skeleton width="30%" height={60} radius={12} />
        <Skeleton width="30%" height={60} radius={12} />
      </div>
      <Skeleton width="100%" height={14} />
      <Skeleton width="85%"  height={14} />
      <Skeleton width="70%"  height={14} />
    </div>
  );
}
