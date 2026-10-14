import { Link } from 'react-router-dom';
import { finalCta as copy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import styles from './FinalCTA.module.css';

/**
 * FinalCTA — dark band with a blurred `cta-01-friends-celebrating` photo
 * backdrop. One italic headline, two CTAs, trust row.
 *
 * The regulatory line in the trust row ("Licensed & regulated") is
 * flagged `TODO(confirm)` in `CLAIMS_TO_CONFIRM.md`.
 */
export default function FinalCTA() {
  const { heading, sub, primary, secondary, trust } = copy;
  return (
    <Band tone="dark" id="open" labelledBy="finalcta-title" className={styles.band}>
      <div className={styles.bg} aria-hidden="true">
        <Img
          image={landingImages.cta1}
          aspect="16/9"
          className={styles.bgImg}
          sizes="100vw"
        />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.content}>
        <SectionHeading
          id="finalcta-title"
          title={heading.title}
          italic={heading.italic}
          align="center"
        />
        <p className={styles.sub}>{sub}</p>

        <div className={styles.ctas}>
          <Link to={primary.to} className={`${styles.primary} btn-lift`}>{primary.label}</Link>
          <Link to={secondary.to} className={styles.secondary}>{secondary.label}</Link>
        </div>

        <ul className={styles.trust} role="list">
          {trust.map((t) => (
            <li key={t} className={styles.trustItem}>{t}</li>
          ))}
        </ul>
      </div>
    </Band>
  );
}
