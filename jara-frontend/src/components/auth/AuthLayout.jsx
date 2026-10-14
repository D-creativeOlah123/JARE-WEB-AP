import { Link } from 'react-router-dom';
import Img from '../landing/ui/Img';
import { appImages } from '../../data/appImages';
import styles from './AuthLayout.module.css';

/**
 * AuthLayout — shared split-screen for Login / Signup / ForgotPassword.
 *
 *   ≥ 900px: left 45% = full-height photo with plum scrim + one italic
 *            Fraunces line; right 55% = form card.
 *   < 900px: photo becomes a 180px header band above the form.
 *
 * The brand medallion sits top-left so there's a one-tap route home.
 *
 * @param {object} props
 * @param {'welcome'|'open'|'reset'} props.photo
 * @param {string}  props.heroLine1              normal weight
 * @param {string}  props.heroLineItalic         italic + gradient
 * @param {React.ReactNode} props.children       the form card contents
 */
export default function AuthLayout({ photo, heroLine1, heroLineItalic, children }) {
  const image =
    photo === 'open'  ? appImages.authOpen :
    photo === 'reset' ? appImages.authReset :
                        appImages.authWelcome;

  return (
    <div className={styles.wrap}>
      <aside className={styles.media} aria-hidden="true">
        <Img
          image={image}
          aspect="4/5"
          priority
          className={styles.mediaImg}
          sizes="(min-width: 900px) 45vw, 100vw"
        />
        <div className={styles.scrim} />
        <div className={styles.mediaContent}>
          <Link to="/" className={styles.brand} aria-label="Jara home">
            <span className={styles.brandMark}>J</span>
            <span className={styles.brandName}>Jara</span>
          </Link>
          <h2 className={styles.hero}>
            {heroLine1}
            {heroLineItalic && (
              <>
                {' '}
                <span className={styles.heroItalic}>{heroLineItalic}</span>
              </>
            )}
          </h2>
        </div>
      </aside>

      <main className={styles.form}>
        <div className={styles.formInner}>{children}</div>
      </main>
    </div>
  );
}
