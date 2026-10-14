import { mosaic as mosaicCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import CountUp from './motion/CountUp';
import styles from './PhotoMosaic.module.css';

/**
 * PhotoMosaic — "Made for how Nigerians actually pay."
 *
 *   - 6-tile CSS grid. Desktop uses a 4×2 layout where tiles 0 and 3 span
 *     two columns (the hero shots of the row). Mobile collapses to 2 cols.
 *   - Each tile = Img + bottom-left glass label chip + ₦ micro-stat that
 *     counts up on scroll-in (CountUp is already in-view-gated).
 *   - Hover (pointer only) scales the photo 1.03 and lifts the label 4px.
 *
 * Content comes from `data/landing.js → mosaic`. Each tile points at a key
 * in `data/landingImages.js` so <Img> handles the LQIP + placeholder.
 */
export default function PhotoMosaic() {
  const { heading, tiles } = mosaicCopy;
  return (
    <Band tone="light" id="personal" labelledBy="mosaic-title">
      <SectionHeading
        id="mosaic-title"
        eyebrow={heading.eyebrow}
        title={heading.title}
        italic={heading.italic}
        sub={heading.sub}
      />

      <ul className={styles.grid} role="list">
        {tiles.map((tile, i) => {
          const image = landingImages[tile.key];
          const spanTwo = i === 0 || i === 3;
          return (
            <li
              key={tile.key}
              className={`${styles.tile} ${spanTwo ? styles.tileSpan2 : ''}`}
              style={{ '--tile-stagger': `${i * 60}ms` }}
            >
              <div className={styles.photoWrap}>
                <Img
                  image={image}
                  aspect={spanTwo ? '16/10' : '1/1'}
                  className={styles.photo}
                  sizes={spanTwo
                    ? '(min-width: 960px) 580px, (min-width: 540px) 90vw, 100vw'
                    : '(min-width: 960px) 280px, (min-width: 540px) 44vw, 50vw'}
                />
                <span className={styles.photoScrim} aria-hidden="true" />
              </div>

              <div className={styles.label}>
                <span className={styles.labelText}>{tile.label}</span>
                <span className={styles.labelStat}>
                  <CountUp to={tile.amount} naira />
                  {tile.suffix && <span className={styles.suffix}>· {tile.suffix}</span>}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}
