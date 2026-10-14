/**
 * App image registry — same shape as `landingImages.js` but served from
 * `public/images/app/`. These accents sit sparingly inside the app
 * (onboarding splits, empty states, success moments). Full list in
 * `DESIGN-BRIEF-02-APP.md` §5.
 *
 * While real photos aren't on disk, `available: false` makes <Img>
 * render a tasteful duotone placeholder with the alt text in small caps.
 */

function placeholderLqip(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  const hue = 300 + (Math.abs(h) % 20) - 10;
  const sat = 32 + (Math.abs(h >> 3) % 10);
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

function img(base, { alt, position = '50% 50%', width = 1200, height = 1200, available = false }) {
  return {
    base,
    dir: 'app',
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

export const appImages = {
  // Auth / onboarding (3)
  authWelcome:   img('auth-01-welcome',       { alt: 'Welcome back to Jara',   width: 1600, height: 2000, position: '50% 40%' }),
  authOpen:      img('auth-02-open-account',  { alt: 'Open a Jara account',    width: 1600, height: 2000 }),
  authReset:     img('auth-03-reset',         { alt: '',                        width: 1600, height: 2000 }),

  // Empty states (6)
  emptyFirstTx:        img('empty-01-first-transaction',   { alt: '' }),
  emptyFirstGoal:      img('empty-02-first-goal',          { alt: '' }),
  emptyFirstGroup:     img('empty-03-first-group',         { alt: '' }),
  emptyNoCards:        img('empty-04-no-cards',            { alt: '' }),
  emptyNoNotifications:img('empty-05-no-notifications',    { alt: '' }),
  emptyNoTickets:      img('empty-06-no-tickets',          { alt: '' }),

  // Transfers hub (2)
  transferHubJara: img('transfer-hub-01-jara', { alt: '', width: 1800, height: 1200 }),
  transferHubBank: img('transfer-hub-02-bank', { alt: '', width: 1800, height: 1200 }),

  // AllServices header (1)
  servicesHeader:  img('services-01-header',   { alt: '', width: 1800, height: 1200 }),

  // Goal category duotones (6, square)
  goalCatRent:      img('goal-cat-rent',      { alt: '' }),
  goalCatSchool:    img('goal-cat-school',    { alt: '' }),
  goalCatBusiness:  img('goal-cat-business',  { alt: '' }),
  goalCatTravel:    img('goal-cat-travel',    { alt: '' }),
  goalCatEmergency: img('goal-cat-emergency', { alt: '' }),
  goalCatGadgets:   img('goal-cat-gadgets',   { alt: '' }),

  // Milestone + support (2)
  savingsGoalReached: img('savings-03-goal-reached', { alt: '' }),
  supportAgent:       img('support-01-agent',        { alt: 'Jara support',          width: 1800, height: 1200 }),

  // Admin (2)
  adminOpsBand:   img('admin-01-ops-team',  { alt: '', width: 1800, height: 300 }),
  adminEmpty:     img('admin-empty-01',     { alt: '' }),
};
