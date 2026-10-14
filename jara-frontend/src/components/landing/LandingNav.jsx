import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Monitor } from 'lucide-react';
import { nav as navCopy } from '../../data/landing';
import { useTheme } from '../../hooks/useTheme';
import styles from './LandingNav.module.css';

/**
 * LandingNav — sticky top nav for the landing page.
 *
 *   - Transparent over the hero, flips to a glass surface once scrolled > 24px
 *     (toggled by a `requestAnimationFrame`-throttled scroll listener).
 *   - Desktop: brand · section links · theme toggle + Log in + Open an account.
 *   - Mobile:  brand · hamburger. Opening the hamburger shows a full-screen
 *     sheet; focus is trapped, `Esc` closes, focus restores to the trigger.
 *
 * `data/landing.js → nav` provides every string + route.
 */
export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const openerRef = useRef(null);
  const sheetRef  = useRef(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab') return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const focusables = sheet.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    sheetRef.current?.querySelector('a, button')?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label={`${navCopy.brand} home`}>
          <span className={styles.brandMark}>J</span>
          <span className={styles.brandName}>{navCopy.brand}</span>
        </Link>

        <nav className={styles.links} aria-label="Primary">
          {navCopy.links.map((l) => (
            <a key={l.href} href={l.href} className={styles.link}>{l.label}</a>
          ))}
        </nav>

        <div className={styles.right}>
          <ThemeToggle />
          <Link to={navCopy.login.to}  className={styles.ghost}>{navCopy.login.label}</Link>
          <Link to={navCopy.signup.to} className={`${styles.cta} btn-lift`}>
            {navCopy.signup.label}
          </Link>
          <button
            ref={openerRef}
            type="button"
            className={styles.hamburger}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="landing-mobile-sheet"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {open && (
        <div
          id="landing-mobile-sheet"
          ref={sheetRef}
          className={styles.sheet}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className={styles.sheetHead}>
            <Link to="/" className={styles.brand} onClick={close}>
              <span className={styles.brandMark}>J</span>
              <span className={styles.brandName}>{navCopy.brand}</span>
            </Link>
            <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close menu">
              <X size={20} />
            </button>
          </div>

          <nav className={styles.sheetLinks} aria-label="Primary">
            {navCopy.links.map((l) => (
              <a key={l.href} href={l.href} className={styles.sheetLink} onClick={close}>
                {l.label}
              </a>
            ))}
          </nav>

          <div className={styles.sheetCtas}>
            <Link to={navCopy.login.to}  className={styles.sheetGhost} onClick={close}>
              {navCopy.login.label}
            </Link>
            <Link to={navCopy.signup.to} className={styles.sheetCta} onClick={close}>
              {navCopy.signup.label}
            </Link>
          </div>

          <div className={styles.sheetFoot}>
            <ThemeToggle inline />
          </div>
        </div>
      )}
    </header>
  );
}

function ThemeToggle({ inline = false }) {
  const { pref, toggle } = useTheme();
  const label =
    pref === 'light'  ? 'Switch to dark theme' :
    pref === 'dark'   ? 'Switch to system theme' :
                        'Switch to light theme';
  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;
  return (
    <button
      type="button"
      className={`${styles.themeBtn} ${inline ? styles.themeBtnInline : ''}`}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <Icon size={16} />
      {inline && <span>{pref === 'light' ? 'Light' : pref === 'dark' ? 'Dark' : 'System'}</span>}
    </button>
  );
}
