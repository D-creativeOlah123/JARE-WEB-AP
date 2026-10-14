import Img from '../../components/landing/ui/Img';
import Band from '../../components/landing/ui/Band';
import SectionHeading from '../../components/landing/ui/SectionHeading';
import Reveal from '../../components/landing/motion/Reveal';
import CountUp from '../../components/landing/motion/CountUp';
import { landingImages } from '../../data/landingImages';
import { useTheme } from '../../hooks/useTheme';
import styles from './LandingPrimitives.module.css';

/**
 * /dev/landing — DEV-only preview of the Phase 1 primitives.
 *
 * Not routed in production builds (gated in App.jsx by `import.meta.env.DEV`).
 * Checkpoint 1 of Design Brief 01 asks us to show the `Img` component
 * rendering a placeholder in both themes; this page is that proof.
 */
export default function LandingPrimitives() {
  const { pref, mode, setTheme } = useTheme();

  return (
    <main className={styles.wrap}>
      <header className={styles.toolbar}>
        <div>
          <h1 className={styles.title}>Landing primitives · Phase 1</h1>
          <p className={styles.sub}>Visible proof for Checkpoint 1. DEV only.</p>
        </div>
        <div className={styles.themeRow}>
          <span className={styles.mode}>mode: <strong>{mode}</strong></span>
          {['light', 'dark', 'system'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`${styles.themeBtn} ${pref === t ? styles.themeBtnOn : ''}`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* -------- Img placeholder (both themes via the toggle above) -------- */}
      <section className={styles.block}>
        <h2 className={styles.h2}>Img — placeholder (available: false)</h2>
        <div className={styles.imgGrid}>
          <Img image={landingImages.hero1} aspect="16/9" />
          <Img image={landingImages.card1} aspect="4/5" />
          <Img image={landingImages.mosaic1} aspect="1/1" />
        </div>
      </section>

      {/* -------- Band tones -------- */}
      <section className={styles.block}>
        <h2 className={styles.h2}>Band — light vs dark</h2>
      </section>
      <Band tone="light">
        <SectionHeading
          eyebrow="Light tone"
          title="Save alone."
          italic="Save together."
          sub="This block uses the light surface token and alternates to --color-bg-elev in dark theme."
        />
      </Band>
      <Band tone="dark">
        <SectionHeading
          eyebrow="Dark tone"
          title="A card that goes"
          italic="everywhere you do."
          sub="The dark band keeps a plum radial glow; invert text stays legible."
        />
      </Band>

      {/* -------- Reveal + CountUp -------- */}
      <Band tone="light">
        <SectionHeading
          eyebrow="Motion"
          title="CountUp +"
          italic="Reveal."
          sub="Scroll into view: the figure counts up once and the surrounding block rises in."
        />
        <Reveal className={styles.statBlock}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <CountUp to={248500} decimals={2} naira duration={1600} />
            </span>
            <span className={styles.statLabel}>Example balance (naira)</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <CountUp to={5200000000} prefix="₦" suffix="+" />
            </span>
            <span className={styles.statLabel}>Moved on Jara (raw count-up)</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              <CountUp to={99.9} decimals={1} suffix="%" />
            </span>
            <span className={styles.statLabel}>Uptime</span>
          </div>
        </Reveal>
      </Band>
    </main>
  );
}
