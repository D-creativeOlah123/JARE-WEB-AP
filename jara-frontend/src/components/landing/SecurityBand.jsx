import { ShieldCheck, KeyRound, Bell, Snowflake } from 'lucide-react';
import { security as copy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import styles from './SecurityBand.module.css';

/**
 * SecurityBand — "Your money, behind a plum vault."
 *
 *   - Dark band; `security-01-woman-confident-phone` photo sits at full
 *     bleed inside the band with a strong plum overlay so text reads over it.
 *   - Four short lines, each with a lucide icon, laid out as a 2×2 grid
 *     on desktop and a column on mobile. One honest line of sub-copy;
 *     no fear-mongering.
 */
const ICONS = [ShieldCheck, KeyRound, Bell, Snowflake];

export default function SecurityBand() {
  const { heading, points } = copy;
  return (
    <Band tone="dark" id="security" labelledBy="security-title" className={styles.band}>
      <div className={styles.bg} aria-hidden="true">
        <Img
          image={landingImages.security1}
          aspect="16/9"
          className={styles.bgImg}
          sizes="100vw"
        />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <SectionHeading
          id="security-title"
          eyebrow={heading.eyebrow}
          title={heading.title}
          italic={heading.italic}
        />
        <ul className={styles.points} role="list">
          {points.map((p, i) => {
            const Icon = ICONS[i] || ShieldCheck;
            return (
              <li key={p} className={styles.point}>
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={16} />
                </span>
                <span>{p}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </Band>
  );
}
