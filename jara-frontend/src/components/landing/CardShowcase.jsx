import { Check } from 'lucide-react';
import { card as cardCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import TiltCard from './motion/TiltCard';
import CardFlip from './motion/CardFlip';
import styles from './CardShowcase.module.css';

/**
 * CardShowcase — "A card that goes everywhere you do."
 *
 *   - Dark band, cinematic.
 *   - Left: `card-01-in-hand-lagos` photo (4:5) with a plum scrim.
 *   - Right: SectionHeading + bullets + the TiltCard-wrapped CardFlip.
 *     TiltCard is given `focusable={false}` so CardFlip (role=button,
 *     tabIndex=0) owns keyboard focus and the Enter/Space flip.
 *   - Network badge below the card: text only — no scheme logos.
 */
export default function CardShowcase() {
  const { heading, bullets, network } = cardCopy;
  return (
    <Band tone="dark" id="card" labelledBy="card-title">
      <div className={styles.grid}>
        <div className={styles.photoCol}>
          <Img
            image={landingImages.card1}
            aspect="4/5"
            className={styles.photo}
            sizes="(min-width: 960px) 440px, 100vw"
          />
          <span className={styles.photoScrim} aria-hidden="true" />
        </div>

        <div className={styles.textCol}>
          <SectionHeading
            id="card-title"
            eyebrow={heading.eyebrow}
            title={heading.title}
            italic={heading.italic}
          />

          <div className={styles.cardStage}>
            <TiltCard focusable={false}>
              <CardFlip />
            </TiltCard>
          </div>

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

          <span className={styles.network}>{network}</span>
        </div>
      </div>
    </Band>
  );
}
