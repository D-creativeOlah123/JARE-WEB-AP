import LandingNav       from '../components/landing/LandingNav';
import HeroCarousel     from '../components/landing/HeroCarousel';
import TrustStrip       from '../components/landing/TrustStrip';
import PhotoMosaic      from '../components/landing/PhotoMosaic';
import TransferShowcase from '../components/landing/TransferShowcase';
import BillsShowcase    from '../components/landing/BillsShowcase';
import SavingsShowcase  from '../components/landing/SavingsShowcase';
import CardShowcase     from '../components/landing/CardShowcase';
import BusinessShowcase from '../components/landing/BusinessShowcase';
import HowItWorks       from '../components/landing/HowItWorks';
import SecurityBand     from '../components/landing/SecurityBand';
import Stories          from '../components/landing/Stories';
import StatsBand        from '../components/landing/StatsBand';
import FAQ              from '../components/landing/FAQ';
import FinalCTA         from '../components/landing/FinalCTA';
import LandingFooter    from '../components/landing/LandingFooter';
import styles           from './Landing.module.css';

/**
 * Public marketing landing — Phase 5 complete.
 *
 * The 16 sections from Design Brief 01 compose in order here. All copy
 * lives in `src/data/landing.js`, all photos in `src/data/landingImages.js`
 * (currently rendering duotone placeholders until real files land in
 * `public/images/landing/`).
 */
export default function Landing() {
  return (
    <div className={styles.page}>
      <LandingNav />
      <main>
        <HeroCarousel />
        <TrustStrip />
        <PhotoMosaic />
        <TransferShowcase />
        <BillsShowcase />
        <SavingsShowcase />
        <CardShowcase />
        <BusinessShowcase />
        <HowItWorks />
        <SecurityBand />
        <Stories />
        <StatsBand />
        <FAQ />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
