import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { business as businessCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import AlertToastDemo from './motion/AlertToastDemo';
import styles from './BusinessShowcase.module.css';

/**
 * BusinessShowcase — "Built for the people who build Nigeria."
 *
 *   - Light band, two columns on desktop.
 *   - Left: `business-01-shop-owner-alert` photo (main) + a small
 *           `business-02-pos-agent-kiosk` inset tucked into the top-left
 *           corner for texture.
 *   - Right: SectionHeading, AlertToastDemo stack, bullets, CTA.
 *   - CTA → `/profile/support` (brief says "Talk to sales (→ /profile/support
 *     for now, or mailto:)").
 */
export default function BusinessShowcase() {
  const { heading, bullets, cta, toasts } = businessCopy;
  return (
    <Band tone="light" id="business" labelledBy="business-title">
      <div className={styles.grid}>
        <div className={styles.photoCol}>
          <Img
            image={landingImages.business1}
            aspect="3/2"
            className={styles.photo}
            sizes="(min-width: 960px) 540px, 100vw"
          />
          <div className={styles.inset}>
            <Img
              image={landingImages.business2}
              aspect="1/1"
              className={styles.insetImg}
              sizes="140px"
            />
          </div>
        </div>

        <div className={styles.textCol}>
          <SectionHeading
            id="business-title"
            eyebrow={heading.eyebrow}
            title={heading.title}
            italic={heading.italic}
          />
          <AlertToastDemo toasts={toasts} />

          <ul className={styles.bullets} role="list">
            {bullets.map((b) => (
              <li key={b} className={styles.bullet}>
                <span className={styles.tick} aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Link to={cta.to} className={`${styles.cta} btn-lift`}>
            {cta.label}
          </Link>
        </div>
      </div>
    </Band>
  );
}
