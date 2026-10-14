import { Quote } from 'lucide-react';
import { stories as copy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import { useCarousel } from '../../hooks/useCarousel';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import styles from './Stories.module.css';

/**
 * Stories — three illustrative customer testimonials.
 *
 *   - Desktop (>820px): all three cards render in a row.
 *   - Mobile: carousel with autoplay (via `useCarousel`) — swipe, dots,
 *     arrow-key support. Pauses on hover/focus/hidden tab/reduced motion.
 *   - Visually-hidden note + visible footnote make the "illustrative"
 *     status honest until real customers opt in.
 */
export default function Stories() {
  const { heading, items } = copy;
  const { index, isCurrent, goTo, regionProps } = useCarousel({
    count: items.length,
    interval: 7000,
    autoplay: true,
  });

  return (
    <Band tone="light" id="stories" labelledBy="stories-title">
      <SectionHeading
        id="stories-title"
        eyebrow={heading.eyebrow}
        title={heading.title}
        italic={heading.italic}
        sub={heading.sub}
        align="center"
      />

      {/* Screen-reader honesty — the heading sub carries the same wording for sighted users. */}
      <span className="sr-only">
        The portraits and quotes below are illustrative until real customers opt in.
      </span>

      {/* Desktop grid */}
      <ul className={`${styles.grid} ${styles.gridDesktop}`} role="list">
        {items.map((s, i) => (
          <StoryCard key={s.name} story={s} index={i} />
        ))}
      </ul>

      {/* Mobile carousel */}
      <div
        {...regionProps}
        aria-label="Customer stories"
        className={styles.carousel}
      >
        <div className={styles.track} style={{ transform: `translateX(-${index * 100}%)` }}>
          {items.map((s, i) => (
            <div key={s.name} className={styles.slide} aria-hidden={!isCurrent(i)}>
              <StoryCard story={s} index={0} isSlide />
            </div>
          ))}
        </div>

        <div className={styles.dots} role="tablist" aria-label="Choose story">
          {items.map((s, i) => (
            <button
              key={s.name}
              type="button"
              role="tab"
              aria-selected={isCurrent(i)}
              aria-current={isCurrent(i) ? 'true' : undefined}
              aria-label={`Go to story ${i + 1}`}
              onClick={() => goTo(i)}
              className={`${styles.dot} ${isCurrent(i) ? styles.dotOn : ''}`}
            />
          ))}
        </div>
      </div>

      <p className={styles.footnote}>Stories are illustrative.</p>
    </Band>
  );
}

function StoryCard({ story, index, isSlide = false }) {
  const image = landingImages[story.imageKey];
  return (
    <li
      className={`${styles.card} ${isSlide ? '' : styles.cardStaggered}`}
      style={isSlide ? undefined : { '--story-stagger': `${index * 80}ms` }}
    >
      <div className={styles.portrait}>
        <Img
          image={image}
          aspect="1/1"
          className={styles.portraitImg}
          sizes="(min-width: 820px) 300px, 70vw"
        />
      </div>
      <blockquote className={styles.quote}>
        <Quote size={14} className={styles.quoteGlyph} aria-hidden="true" />
        <p>{story.quote}</p>
        <footer className={styles.cite}>
          <span className={styles.citeName}>{story.name}</span>
          <span className={styles.citeRole}>{story.role}</span>
        </footer>
        <p className={styles.detail}>{story.detail}</p>
      </blockquote>
    </li>
  );
}
