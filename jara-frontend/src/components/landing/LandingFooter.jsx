import { Link } from 'react-router-dom';
// Lucide dropped branded logos (Twitter/Instagram/LinkedIn/GitHub) in this
// version — on-brand with the rest of the landing's "no real logos" rule.
// We use neutral glyphs with text + aria-labels naming the network.
import { AtSign, Camera, Briefcase, Code, Sun, Moon, Monitor } from 'lucide-react';
import { footer as copy, nav as navCopy } from '../../data/landing';
import { useTheme } from '../../hooks/useTheme';
import styles from './LandingFooter.module.css';

/**
 * LandingFooter — 4-column link footer, theme toggle, social icons,
 * small print.
 *
 * The regulatory line is placeholder copy flagged `TODO(confirm)` in
 * `CLAIMS_TO_CONFIRM.md`.
 */
export default function LandingFooter() {
  const { columns, smallPrint } = copy;
  const { pref, toggle } = useTheme();

  const themeLabel =
    pref === 'light'  ? 'Switch to dark theme' :
    pref === 'dark'   ? 'Switch to system theme' :
                        'Switch to light theme';
  const ThemeIcon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;
  const themeText = pref === 'light' ? 'Light' : pref === 'dark' ? 'Dark' : 'System';

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.topRow}>
          <Link to="/" className={styles.brand} aria-label={`${navCopy.brand} home`}>
            <span className={styles.brandMark}>J</span>
            <span className={styles.brandName}>{navCopy.brand}</span>
          </Link>
          <p className={styles.tagline}>
            A Nigerian digital bank. Accounts, transfers, bills, savings, and cards —
            all from one app.
          </p>
        </div>

        <nav aria-label="Footer" className={styles.cols}>
          {columns.map((col) => (
            <div key={col.heading} className={styles.col}>
              <h3 className={styles.colHead}>{col.heading}</h3>
              <ul className={styles.colList}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to
                      ? <Link to={l.to} className={styles.colLink}>{l.label}</Link>
                      : <a   href={l.href} className={styles.colLink}>{l.label}</a>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.bottomRow}>
          <div className={styles.socials} aria-label="Social links">
            <a href="#twitter"   aria-label="Twitter / X"  title="Twitter / X"  className={styles.social}><AtSign    size={16} /></a>
            <a href="#instagram" aria-label="Instagram"    title="Instagram"    className={styles.social}><Camera    size={16} /></a>
            <a href="#linkedin"  aria-label="LinkedIn"     title="LinkedIn"     className={styles.social}><Briefcase size={16} /></a>
            <a href="#github"    aria-label="GitHub"       title="GitHub"       className={styles.social}><Code      size={16} /></a>
          </div>

          <button
            type="button"
            className={`${styles.themeBtn} btn-lift`}
            onClick={toggle}
            aria-label={themeLabel}
          >
            <ThemeIcon size={14} />
            <span>{themeText}</span>
          </button>
        </div>

        <p className={styles.smallPrint}>{smallPrint}</p>
      </div>
    </footer>
  );
}
