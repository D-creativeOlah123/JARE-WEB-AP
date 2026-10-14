import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { transfers as transfersCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import TransferAnimation from './motion/TransferAnimation';
import styles from './TransferShowcase.module.css';

/**
 * TransferShowcase — "Send money like sending a text."
 *
 *   - Light band, two columns on desktop; stacks on mobile.
 *   - Left: SectionHeading + 4 bullets + primary CTA.
 *   - Right: the `TransferAnimation` sits inside a frame with a blurred
 *            darker photo backdrop (`transfers1`), so the animation reads
 *            as "this is real money moving between real phones".
 */
export default function TransferShowcase() {
  const { heading, bullets, cta, animation } = transfersCopy;
  return (
    <Band tone="light" id="transfers" labelledBy="transfers-title">
      <div className={styles.grid}>
        <div className={styles.text}>
          <SectionHeading
            id="transfers-title"
            eyebrow={heading.eyebrow}
            title={heading.title}
            italic={heading.italic}
          />

          <ul className={styles.bullets}>
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

        <div className={styles.stage}>
          <div className={styles.backdrop} aria-hidden="true">
            <Img
              image={landingImages.transfers1}
              aspect="3/2"
              className={styles.backdropImg}
              sizes="(min-width: 960px) 540px, 100vw"
            />
            <span className={styles.backdropScrim} />
          </div>
          <TransferAnimation config={animation} />
        </div>
      </div>
    </Band>
  );
}
