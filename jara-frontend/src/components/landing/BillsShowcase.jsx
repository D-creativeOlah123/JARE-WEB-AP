import { bills as billsCopy } from '../../data/landing';
import { landingImages } from '../../data/landingImages';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import Img from './ui/Img';
import { formatNaira } from '../../utils/format';
import styles from './BillsShowcase.module.css';

/**
 * BillsShowcase — "Every bill, one tap."
 *
 *   - Dark band, two columns on desktop; stacks on mobile.
 *   - Left: 3:2 photo (`bills-01-student-paying-fees`).
 *   - Right: provider grid using *brand colours* and *text wordmarks only*.
 *     Logos are forbidden by Brief 01 §10. Each tile shows a tiny recent
 *     sample ("₦2,000 · 2m ago") that staggers in on mount.
 *
 * The brand-colour swatches live here, not in `data/landing.js`, because
 * they're styling details for marketing, not product truth. Names come
 * from `data/landing.js → bills.providers`.
 */

// Nigerian provider accent colours (not logos — just the brand hue).
const COLOURS = {
  MTN:        '#FFCC00',
  Airtel:     '#ED1C24',
  Glo:        '#52AE33',
  '9mobile':  '#1E6B41',
  IKEDC:      '#0E6C9A',
  EKEDC:      '#004B87',
  AEDC:       '#1E3A5F',
  DStv:       '#003399',
  GOtv:       '#E60012',
  Startimes:  '#FF6600',
  Showmax:    '#2E2E2E',
  WAEC:       '#0A4D2D',
  JAMB:       '#1E4D7B',
};

// Cycle these samples deterministically through the provider list so each
// tile shows a plausible recent-payment line.
const SAMPLE_AMOUNTS = [2000, 1500, 5000, 500, 15000, 20000, 10000, 24500, 3000, 1000, 2900, 29000, 7500];
const SAMPLE_WHENS   = ['2m ago', '5m ago', '12m ago', '1h ago', '2h ago', 'Just now', '4m ago', '18m ago'];

export default function BillsShowcase() {
  const { heading, footnote, providers } = billsCopy;
  const flat = [
    ...providers.airtime,
    ...providers.power,
    ...providers.tv,
    ...providers.education,
  ];

  return (
    <Band tone="dark" id="bills" labelledBy="bills-title">
      <div className={styles.grid}>
        <div className={styles.photoCol}>
          <Img
            image={landingImages.bills1}
            aspect="3/2"
            className={styles.photo}
            sizes="(min-width: 960px) 500px, 100vw"
          />
          <span className={styles.photoScrim} aria-hidden="true" />
        </div>

        <div className={styles.textCol}>
          <SectionHeading
            id="bills-title"
            eyebrow={heading.eyebrow}
            title={heading.title}
            italic={heading.italic}
          />

          <ul className={styles.providerGrid} role="list">
            {flat.map((name, i) => {
              const amount = SAMPLE_AMOUNTS[i % SAMPLE_AMOUNTS.length];
              const when   = SAMPLE_WHENS[i % SAMPLE_WHENS.length];
              const colour = COLOURS[name] || '#9B5A91';
              return (
                <li
                  key={name}
                  className={styles.tile}
                  style={{
                    '--provider-colour': colour,
                    '--tile-stagger': `${i * 40}ms`,
                  }}
                >
                  <span className={styles.tileSwatch} aria-hidden="true" />
                  <span className={styles.tileName}>{name}</span>
                  <span className={styles.tileRecent}>
                    {formatNaira(amount)} · {when}
                  </span>
                </li>
              );
            })}
          </ul>

          <p className={styles.footnote}>{footnote}</p>
        </div>
      </div>
    </Band>
  );
}
