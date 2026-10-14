import { howItWorks as copy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import { useInView } from '../../hooks/useInView';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import styles from './HowItWorks.module.css';

/**
 * HowItWorks — 3-step timeline that draws its connecting SVG line on
 * scroll-in via `stroke-dashoffset`.
 *
 * The path uses `pathLength="100"` so the dash controls read as 0–100
 * regardless of the rendered width — perfect for a responsive line.
 *
 * Order mirrors the real `Signup.jsx` wizard: form → PIN → account-created.
 */
export default function HowItWorks() {
  const reduced = useReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.35, once: true });
  const lineOn = reduced || inView;

  return (
    <Band tone="light" id="how" labelledBy="how-title">
      <SectionHeading
        id="how-title"
        eyebrow={copy.heading.eyebrow}
        title={copy.heading.title}
        italic={copy.heading.italic}
        align="center"
      />

      <ol ref={ref} className={styles.timeline} role="list">
        {/* Connector line — hidden under 820px, visible only on desktop. */}
        <svg
          className={styles.line}
          aria-hidden="true"
          viewBox="0 0 100 4"
          preserveAspectRatio="none"
        >
          <path
            d="M 2 2 L 98 2"
            pathLength="100"
            className={`${styles.linePath} ${lineOn ? styles.linePathOn : ''}`}
          />
        </svg>

        {copy.steps.map((step, i) => {
          const image = landingImages[step.imageKey];
          return (
            <li key={step.title} className={styles.step} style={{ '--step-stagger': `${i * 160}ms` }}>
              <div className={styles.thumb}>
                <Img
                  image={image}
                  aspect="1/1"
                  className={styles.thumbImg}
                  sizes="(min-width: 820px) 220px, 60vw"
                />
                <span className={styles.stepNum} aria-hidden="true">{i + 1}</span>
              </div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepBody}>{step.body}</p>
            </li>
          );
        })}
      </ol>
    </Band>
  );
}
