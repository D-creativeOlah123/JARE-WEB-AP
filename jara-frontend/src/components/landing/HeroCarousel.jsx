import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { hero as heroCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import { formatNaira } from '../../utils/format';
import { useCarousel } from '../../hooks/useCarousel';
import Img from './ui/Img';
import CountUp from './motion/CountUp';
import TiltCard from './motion/TiltCard';
import MiniJaraCard from './mini/MiniJaraCard';
import styles from './HeroCarousel.module.css';

/**
 * HeroCarousel — above-the-fold hero.
 *
 *   - Two-column 7/5 on desktop, stacked on mobile.
 *   - Left column:   static H1 (second line italic gradient), sub, 2 CTAs,
 *                    trust row. Eyebrow + stat chip crossfade per slide.
 *   - Right column:  photo carousel (CSS scroll-snap + opacity crossfade +
 *                    Ken-Burns on the active slide), floating TiltCard
 *                    (MiniJaraCard) overlapping bottom-left, CountUp balance
 *                    chip top-right, prev/next buttons, dots.
 *
 * All slide data lives in `data/landing.js → hero`. Image keys resolve
 * against `data/landingImages.js`.
 */
export default function HeroCarousel() {
  const slides = heroCopy.slides;
  const { index, goTo, next, prev, isCurrent, regionProps } = useCarousel({
    count: slides.length,
    interval: 6000,
    autoplay: true,
  });

  const current = slides[index];

  return (
    <section className={styles.hero} aria-labelledby="hero-h1">
      <div className={styles.inner}>
        {/* ---------- LEFT ---------- */}
        <div className={styles.text}>
          <p className={styles.eyebrow} aria-live="polite">{current.eyebrow}</p>

          <h1 id="hero-h1" className={styles.title}>
            {heroCopy.titleLine1}
            <br />
            <span className={styles.italic}>{heroCopy.titleLine2}</span>
          </h1>

          <p className={styles.sub}>{heroCopy.sub}</p>

          <div className={styles.ctas}>
            <Link to={heroCopy.ctaPrimary.to} className={`${styles.primary} btn-lift`}>
              {heroCopy.ctaPrimary.label}
            </Link>
            <a href={heroCopy.ctaSecondary.href} className={styles.secondary}>
              {heroCopy.ctaSecondary.label}
            </a>
          </div>

          <p className={styles.trust}>{heroCopy.trust}</p>
        </div>

        {/* ---------- RIGHT ---------- */}
        <div
          {...regionProps}
          aria-label="Jara in everyday life"
          className={styles.showcase}
        >
          {/* Slide stack — all mounted; only the active one gets opacity 1 + Ken-Burns */}
          <div className={styles.slides}>
            {slides.map((slide, i) => {
              const active = isCurrent(i);
              return (
                <div
                  key={slide.key}
                  className={`${styles.slide} ${active ? styles.slideActive : ''}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${slides.length}`}
                  aria-hidden={!active}
                >
                  <div className={styles.photoWrap}>
                    <Img
                      image={landingImages[slide.key]}
                      aspect="4/5"
                      priority={i === 0}
                      className={styles.photo}
                      sizes="(min-width: 1024px) 480px, 100vw"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Caption chip — bottom-left */}
          <div className={styles.captionChip} aria-live="polite">
            <span className={styles.captionDot} />
            {current.caption}
          </div>

          {/* Balance chip — top-right (CountUp runs on first in-view) */}
          <div className={styles.balanceChip}>
            <span className={styles.balanceLabel}>{heroCopy.balanceChip.label}</span>
            <span className={styles.balanceValue}>
              <CountUp
                to={heroCopy.balanceChip.to}
                from={heroCopy.balanceChip.from}
                decimals={heroCopy.balanceChip.decimals}
                naira
                duration={1600}
              />
            </span>
          </div>

          {/* Floating TiltCard — bottom-left overlap */}
          <div className={styles.cardFloat}>
            <TiltCard ariaLabel="Jara card preview">
              <MiniJaraCard />
            </TiltCard>
          </div>

          {/* Per-slide stat chip — top-left of the photo */}
          <div className={styles.statChip} aria-live="polite">
            <span className={styles.statLabel}>{current.statLabel}</span>
            <span className={`${styles.statValue} ${current.positive ? styles.positive : ''}`}>
              {current.statPercent !== undefined
                ? `${current.statPercent}%`
                : `${current.positive ? '+' : ''}${formatNaira(current.statValue)}`}
            </span>
          </div>

          {/* Prev / next */}
          <button
            type="button"
            onClick={prev}
            className={`${styles.navBtn} ${styles.prev}`}
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className={`${styles.navBtn} ${styles.next}`}
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className={styles.dots} role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={isCurrent(i)}
                aria-current={isCurrent(i) ? 'true' : undefined}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`${styles.dot} ${isCurrent(i) ? styles.dotOn : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
