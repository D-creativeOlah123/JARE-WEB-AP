/**
 * Landing image registry.
 *
 * Every photo slot the landing page uses lives here. Each entry is a plain
 * object describing where the file is, what shape it has, where the focal
 * point sits, and a 24px-wide LQIP data-URI. The <Img> component reads
 * from here — components never hard-code paths.
 *
 * While real photos aren't on disk yet, `available: false` is the signal
 * for <Img> to render a tasteful duotone placeholder with the alt text in
 * small-caps instead of a broken image. Flip `available: true` per entry
 * as Olalekan drops a file into `public/images/landing/`.
 *
 * Width/height are intrinsic (pre-CLS) numbers — pick the base aspect
 * ratio for each shot (16:9 hero, 1:1 mosaic, 4:5 portrait, 3:2 band). The
 * <Img> component also accepts an `aspect` prop for overrides.
 */

/**
 * Make a tiny inline SVG LQIP, 24×16, as a data URI. One soft plum→plum-dark
 * gradient tinted by a hash of the slug so each image LQIP is subtly
 * different. The <picture> loads over the top in a crossfade.
 *
 * This is a deterministic placeholder — once we have real photos, a build
 * step can swap in BlurHash-style LQIPs without touching components.
 */
function placeholderLqip(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const hue = 300 + (Math.abs(h) % 20) - 10;          // 290–310 (plum family)
  const sat = 32 + (Math.abs(h >> 3) % 10);           // 32–41
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 16'>` +
    `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
    `<stop offset='0%' stop-color='hsl(${hue} ${sat}% 48%)'/>` +
    `<stop offset='100%' stop-color='hsl(${hue + 10} ${sat}% 26%)'/>` +
    `</linearGradient></defs>` +
    `<rect width='24' height='16' fill='url(#g)'/>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* Shorthand builder — all landing images share the same widths + format set.
   Width/height default to 1600×900 (16:9); pass overrides where it matters. */
function img(base, { alt, position = '50% 50%', width = 1600, height = 900, available = false }) {
  return {
    base,
    dir: 'landing',
    widths: [640, 1280, 1920],
    formats: ['webp'],
    width,
    height,
    alt,
    objectPosition: position,
    lqip: placeholderLqip(base),
    available,
  };
}

/** All 24 slots named in Brief 01 §4. */
export const landingImages = {
  // --- Hero carousel (5) --- 16:9 base
  hero1: img('hero-01-market-card',       { alt: 'A woman pays with a Jara card at a market stall',   position: '55% 40%' }),
  hero2: img('hero-02-phone-transfer',    { alt: 'A man sends money on his phone',                    position: '50% 45%' }),
  hero3: img('hero-03-shop-owner-alert',  { alt: 'A shop owner receives a transfer alert',            position: '50% 40%' }),
  hero4: img('hero-04-family-saving',     { alt: 'A family saves together on Jara',                   position: '50% 45%' }),
  hero5: img('hero-05-petrol-station',    { alt: 'A driver pays for fuel with a card',                position: '50% 55%' }),

  // --- Everyday-money mosaic (6) --- 1:1 + 4:5
  mosaic1: img('mosaic-01-pos-agent',           { alt: 'A POS agent serves a customer',   width: 1200, height: 1200 }),
  mosaic2: img('mosaic-02-atm-withdrawal',      { alt: 'Cash withdrawal at an ATM',       width: 1200, height: 1500 }),
  mosaic3: img('mosaic-03-student-school-fees', { alt: 'A student pays school fees on their phone', width: 1200, height: 1500 }),
  mosaic4: img('mosaic-04-airtime-on-the-go',   { alt: 'Buying airtime on the go',        width: 1200, height: 1200 }),
  mosaic5: img('mosaic-05-danfo-transport',     { alt: 'Paying for transport',            width: 1200, height: 1200 }),
  mosaic6: img('mosaic-06-electricity-meter',   { alt: 'Loading an electricity token',    width: 1200, height: 1200 }),

  // --- Showcases ---
  transfers1: img('transfers-01-two-friends-phones', { alt: 'Two friends sending money to each other', width: 1800, height: 1200 }),
  bills1:     img('bills-01-student-paying-fees',    { alt: 'A parent pays school fees',               width: 1800, height: 1200 }),
  savings1:   img('savings-01-family-planning',      { alt: 'A couple plans their savings',            width: 1200, height: 1500 }),
  savings2:   img('savings-02-market-women-ajo',     { alt: 'A savings group meeting',                 width: 1200, height: 1200 }),
  card1:      img('card-01-in-hand-lagos',           { alt: 'A Jara card held up against the Lagos skyline', width: 1200, height: 1500 }),
  business1:  img('business-01-shop-owner-alert',    { alt: 'A business owner checks a payment alert', width: 1800, height: 1200 }),
  business2:  img('business-02-pos-agent-kiosk',     { alt: 'A POS terminal prints a receipt',         width: 1200, height: 1200 }),

  // --- How-it-works (3 small 1:1 thumbs)
  steps1: img('steps-01-bvn-entry',       { alt: 'Entering details to open an account', width: 1000, height: 1000 }),
  steps2: img('steps-02-otp',             { alt: 'Receiving a verification code',       width: 1000, height: 1000 }),
  steps3: img('steps-03-account-ready',   { alt: 'Account opened',                      width: 1000, height: 1000 }),

  // --- Trust band + stories + CTA
  security1: img('security-01-woman-confident-phone', { alt: 'Banking securely on Jara' }),
  story1:    img('stories-01-amaka',   { alt: 'Portrait of Amaka',   width: 1000, height: 1000 }),
  story2:    img('stories-02-ibrahim', { alt: 'Portrait of Ibrahim', width: 1000, height: 1000 }),
  story3:    img('stories-03-tolu',    { alt: 'Portrait of Tolu',    width: 1000, height: 1000 }),
  cta1:      img('cta-01-friends-celebrating', { alt: '' }),   // decorative
};
