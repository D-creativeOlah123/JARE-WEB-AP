import { savings as savingsCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import MiniGoalCard from './mini/MiniGoalCard';
import MiniAjoCard from './mini/MiniAjoCard';
import styles from './SavingsShowcase.module.css';

/**
 * SavingsShowcase — "Save alone. Save together."
 *
 *   - Light band, two columns on desktop.
 *   - Left: full-height `savings-01-family-planning` photo with a small
 *     `savings-02-market-women-ajo` inset tucked into the bottom-right
 *     corner.
 *   - Right: SectionHeading on top, then stacked MiniGoalCard +
 *     MiniAjoCard that each animate their progress bars + CountUp when
 *     scrolled into view.
 */
export default function SavingsShowcase() {
  const { heading, goal, ajo } = savingsCopy;
  return (
    <Band tone="light" id="savings" labelledBy="savings-title">
      <div className={styles.grid}>
        <div className={styles.photoCol}>
          <Img
            image={landingImages.savings1}
            aspect="4/5"
            className={styles.photo}
            sizes="(min-width: 960px) 480px, 100vw"
          />
          <div className={styles.inset}>
            <Img
              image={landingImages.savings2}
              aspect="1/1"
              className={styles.insetImg}
              sizes="160px"
            />
          </div>
        </div>

        <div className={styles.textCol}>
          <SectionHeading
            id="savings-title"
            eyebrow={heading.eyebrow}
            title={heading.title}
            italic={heading.italic}
          />
          <div className={styles.cards}>
            <MiniGoalCard goal={goal} />
            <MiniAjoCard  ajo={ajo} />
          </div>
        </div>
      </div>
    </Band>
  );
}
