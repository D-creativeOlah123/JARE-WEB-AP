import { Link } from 'react-router-dom';
import { ChevronRight, Target } from 'lucide-react';
import { formatNaira } from '../../utils/format';
import Skeleton from '../Skeleton';
import EmptyState from '../states/EmptyState';
import { appImages } from '../../data/appImages';
import styles from './GoalsStrip.module.css';

/**
 * GoalsStrip — horizontally scrolling thumbnails of the user's active
 * savings goals.
 *
 *   - Loading → shimmer card.
 *   - Empty   → compact EmptyState with a "Create goal" CTA.
 *   - Each card: progress ring (SVG) + name + ₦ saved / target + chevron
 *     to the goal detail page.
 */
export default function GoalsStrip({ goals = [], loading = false }) {
  if (loading) {
    return (
      <section className={styles.wrap} aria-label="Savings goals">
        <header className={styles.head}>
          <h3 className={styles.title}>Your goals</h3>
        </header>
        <div className={styles.track} aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <Skeleton width={44} height={44} radius="50%" />
              <Skeleton width="70%" height={12} />
              <Skeleton width="50%" height={10} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!goals.length) {
    return (
      <section className={styles.wrap} aria-label="Savings goals">
        <header className={styles.head}>
          <h3 className={styles.title}>Your goals</h3>
        </header>
        <EmptyState
          image={appImages.emptyFirstGoal}
          title="Start your first goal"
          body="Set a target, let Jara save with you weekly."
          cta={{ label: 'Create goal', to: '/my-jara/new' }}
          className={styles.empty}
        />
      </section>
    );
  }

  return (
    <section className={styles.wrap} aria-label="Savings goals">
      <header className={styles.head}>
        <h3 className={styles.title}>Your goals</h3>
        <Link to="/my-jara" className={styles.seeAll}>
          See all <ChevronRight size={13} />
        </Link>
      </header>

      <div className={styles.track}>
        {goals.map((g) => {
          const pct = Math.min(100, Math.round(((g.savedAmount || 0) / (g.targetAmount || 1)) * 100));
          return (
            <Link
              key={g._id || g.id}
              to={`/my-jara/${g._id || g.id}`}
              className={`${styles.card} btn-lift`}
            >
              <ProgressRing pct={pct} />
              <span className={styles.name}>{g.name}</span>
              <span className={styles.money}>
                {formatNaira((g.savedAmount || 0) / 100)}
                <span className={styles.ofTarget}>
                  {' '}of {formatNaira((g.targetAmount || 0) / 100)}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* Small SVG progress ring, 44×44. */
function ProgressRing({ pct }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <span className={styles.ring} aria-hidden="true">
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} className={styles.ringTrack} />
        <circle cx="24" cy="24" r={r} className={styles.ringFill}
          strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <Target size={14} className={styles.ringIcon} />
    </span>
  );
}
