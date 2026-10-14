/**
 * All landing-page copy. Components never hard-code strings — they import
 * from here. Nigerian English throughout. ₦ figures use `formatNaira` at
 * render time; raw numbers (naira, not kobo) live here.
 *
 * Regulatory / fee / delivery claims are flagged `TODO(confirm)` and
 * listed in `CLAIMS_TO_CONFIRM.md` at the frontend root.
 */

export const nav = {
  brand: 'Jara',
  links: [
    { href: '#personal', label: 'Personal' },
    { href: '#business', label: 'Business' },
    { href: '#card',     label: 'Cards' },
    { href: '#savings',  label: 'Savings' },
    { href: '#faq',      label: 'Help' },
  ],
  login:  { label: 'Log in',             to: '/login'  },
  signup: { label: 'Open an account',    to: '/signup' },
};

export const hero = {
  titleLine1: 'Your money, your way.',
  titleLine2: 'Banking that moves at Lagos speed.',   // italic in render
  sub:
    'Open a full Jara account in 3 minutes with your BVN. Send money, pay bills, ' +
    'save with friends, and spend with your Jara card — all from one app.',
  ctaPrimary:   { label: 'Open an account', to: '/signup' },
  ctaSecondary: { label: 'See how it works', href: '#how' },
  trust:
    'Instant transfers to all Nigerian banks · 24/7 in-app support · PIN + OTP on every transfer',
  balanceChip: { label: 'Available balance', from: 0, to: 248500, decimals: 2 },
  slides: [
    { key: 'hero1', eyebrow: 'Everyday payments',    caption: 'Tap to pay at Balogun Market',   statLabel: 'Approved', statValue: 1250 },
    { key: 'hero2', eyebrow: 'Instant transfers',    caption: 'Send to any bank in seconds',     statLabel: 'to GTBank · 2s', statValue: 45000 },
    { key: 'hero3', eyebrow: 'Credit alerts',        caption: 'Credit alerts you can trust',     statLabel: 'from Chinedu O.', statValue: 18500, positive: true },
    { key: 'hero4', eyebrow: 'Save together',        caption: 'Save together with Ajo groups',   statLabel: 'Family Rent Fund', statPercent: 72 },
    { key: 'hero5', eyebrow: 'Everyday fuel',        caption: 'Fuel up, pay with your card',     statLabel: 'Mobil Lekki', statValue: 32000 },
  ],
};

/** Trust strip — all placeholder claims flagged. */
export const trustStrip = [
  { label: 'Licensed & regulated',     todo: true  },   // TODO(confirm)
  { label: 'Deposits protected',       todo: true  },   // TODO(confirm)
  { label: '256-bit encryption',       todo: false },
  { label: 'BVN-verified accounts',    todo: false },
  { label: 'Powered by Paystack rails',todo: false },
];

export const mosaic = {
  heading: {
    eyebrow: 'Everyday money',
    title:   'Made for how Nigerians',
    italic:  'actually pay.',
    sub:     'Cash, card, bank transfer, airtime, light bills — one app, all of it.',
  },
  tiles: [
    { key: 'mosaic1', label: 'Cash in / cash out at 40,000+ POS agents', amount: 5000,   suffix: 'withdrawn' },
    { key: 'mosaic2', label: 'Withdraw at any ATM nationwide',           amount: 20000 },
    { key: 'mosaic3', label: 'Pay school fees in-app',                   amount: 185000, suffix: 'UNILAG' },
    { key: 'mosaic4', label: 'Airtime & data, every network',            amount: 2000,   suffix: 'MTN' },
    { key: 'mosaic5', label: 'Transport, tolls, everyday spend',         amount: 700 },
    { key: 'mosaic6', label: 'Light bills, prepaid or postpaid',         amount: 15000,  suffix: 'IKEDC' },
  ],
};

export const transfers = {
  heading: {
    eyebrow: 'Transfers',
    title:   'Send money like',
    italic:  'sending a text.',
  },
  bullets: [
    'Free Jara-to-Jara transfers',                         // TODO(confirm)
    '₦10 flat fee to any other Nigerian bank',             // TODO(confirm)
    '₦100 minimum, ₦1,000,000 maximum per transfer',
    'Delivered in seconds · receipt for every send',
  ],
  cta: { label: 'Start sending', to: '/signup' },
  animation: {
    sender:    { name: 'You',           amount: 25000 },
    recipient: { name: 'Aminat Bello',  account: '9123456789' },
    creditAlert: '+₦25,000 from Tunde A.',
  },
};

export const bills = {
  heading: {
    eyebrow: 'Bills & airtime',
    title:   'Every bill,',
    italic:  'one tap.',
  },
  footnote: 'Instant value. Receipts for everything.',
  providers: {
    airtime: ['MTN', 'Airtel', 'Glo', '9mobile'],
    power:   ['IKEDC', 'EKEDC', 'AEDC'],
    tv:      ['DStv', 'GOtv', 'Startimes', 'Showmax'],
    education: ['WAEC', 'JAMB'],
  },
  samples: [
    { who: 'MTN',    amount: 2000, when: '2m ago' },
    { who: 'IKEDC',  amount: 15000, when: '12m ago' },
    { who: 'DStv',   amount: 24500, when: '1h ago' },
    { who: 'WAEC',   amount: 29000, when: '2h ago' },
  ],
};

export const savings = {
  heading: {
    eyebrow: 'Savings & Ajo',
    title:   'Save alone.',
    italic:  'Save together.',
  },
  goal: {
    name:   'New Laptop',
    target: 450000,
    saved:  306000,
    pct:    68,
  },
  ajo: {
    name:   'Umeh Family Rent',
    target: 1800000,
    saved:  1200000,
    members: ['CO', 'AB', 'TA', 'NU', 'YI'],
    nextLabel: 'Next contribution',
    nextDate:  'Fri 10 Oct · ₦50,000',
  },
};

export const card = {
  heading: {
    eyebrow: 'The Jara card',
    title:   'A card that goes',
    italic:  'everywhere you do.',
  },
  bullets: [
    'Virtual card in seconds',
    'Physical card delivered in Lagos, Abuja, PH',  // TODO(confirm)
    'Freeze from the app',
    'Spend limits you control',
  ],
  network: 'Verve / Mastercard-ready',
  // Face copy for the CSS card:
  face: {
    bankName: 'JARA',
    cardholder: 'CHINEDU OKORO',
    number:  '•••• •••• •••• 4821',
    valid:   '09 / 29',
  },
};

export const business = {
  heading: {
    eyebrow: 'For business',
    title:   'Built for the people who',
    italic:  'build Nigeria.',
  },
  bullets: [
    'Business account in minutes',
    'Bulk transfers via CSV',
    'POS settlement same-day',
    'Team access with roles',
  ],
  cta: { label: 'Talk to sales', to: '/profile/support' },
  toasts: [
    { title: '+₦7,500 from Ngozi U.',    detail: 'POS'              },
    { title: '+₦120,000 from Invoice #0421', detail: 'Bank transfer' },
    { title: '+₦3,200 from Yusuf I.',    detail: 'Airtime refund'   },
  ],
};

export const howItWorks = {
  heading: {
    eyebrow: 'How it works',
    title:   'From zero to banking in',
    italic:  '3 minutes.',
  },
  steps: [
    { imageKey: 'steps1', title: '1. Tell us who you are',   body: 'Enter your phone, email and BVN. We verify your identity in seconds.' },
    { imageKey: 'steps2', title: '2. Secure your money',     body: 'Set a 4-digit transfer PIN, confirm by SMS or email code.' },
    { imageKey: 'steps3', title: '3. Start banking',         body: 'Get your 10-digit Jara account number instantly. Fund, send, save, spend.' },
  ],
};

export const security = {
  heading: {
    eyebrow: 'Security',
    title:   'Your money,',
    italic:  'behind a plum vault.',
  },
  points: [
    'BVN-verified identity',
    'PIN + OTP on every transfer',
    'Device & login alerts',
    'Freeze your card instantly',
  ],
};

export const stories = {
  heading: {
    eyebrow: 'Stories',
    title:   'Nigerians who moved money',
    italic:  'with Jara.',
    sub:     'Stories are illustrative until our first wave of real customers opts in.',
  },
  items: [
    {
      imageKey: 'story1',
      name: 'Amaka Nwosu',
      role: 'Fashion retailer, Aba',
      quote: 'Credit alerts come instantly. No more "I\'ve sent you" lies — I see it or I don\'t release the fabric.',
      detail: 'Saved ₦600,000 for new sewing machines',
    },
    {
      imageKey: 'story2',
      name: 'Ibrahim Musa',
      role: 'Provisions trader, Kano',
      quote: 'My apprentices get a card each. I set their daily limit from my phone, and I see every spend.',
      detail: '4 cards, daily limits set in-app',
    },
    {
      imageKey: 'story3',
      name: 'Tolu Adebayo',
      role: 'Student, Ibadan',
      quote: 'Our Ajo keeps us honest. Everyone contributes on the same day — it just works.',
      detail: 'Hit a ₦250,000 laptop goal with 4 friends',
    },
  ],
};

export const stats = {
  heading: {
    eyebrow: 'By the numbers',
    title:   'The quiet way',
    italic:  'Nigeria is moving money.',
  },
  items: [
    { label: '₦ moved',       to: 5_200_000_000, prefix: '₦', suffix: '+' },
    { label: 'Accounts',       to: 50_000,        suffix: '+' },
    { label: 'POS agents',     to: 40_000,        suffix: '+' },
    { label: 'Uptime',         to: 99.9,          suffix: '%', decimals: 1 },
  ],
};

export const faq = {
  heading: {
    eyebrow: 'Help',
    title:   'Common',
    italic:  'questions.',
  },
  items: [
    {
      q: 'Is Jara a bank?',
      a: 'Jara is a licensed digital banking product offering current accounts, transfers, bills, savings and cards. Regulatory details are listed at the bottom of this page.',  // TODO(confirm)
    },
    {
      q: 'What do I need to open an account?',
      a: 'Your phone, email, BVN, and a 4-digit transfer PIN of your choice. Account creation takes under 3 minutes.',
    },
    {
      q: 'Is there a minimum balance?',
      a: 'No. You can run a Jara account with ₦0 and only fund it when you need to send or spend.',  // TODO(confirm)
    },
    {
      q: 'How fast are transfers?',
      a: 'Jara-to-Jara transfers settle instantly. Transfers to other banks typically land within seconds; a small number stay in processing for up to 24 hours depending on the receiving bank.',
    },
    {
      q: 'What are the fees?',
      a: 'Jara-to-Jara transfers are free. Transfers to any other Nigerian bank cost ₦10, flat. Full fee list is in Settings.',  // TODO(confirm)
    },
    {
      q: 'Can I get a physical card?',
      a: 'Yes — the Jara card ships in Lagos, Abuja and Port Harcourt first, with the rest of Nigeria rolling out next.',  // TODO(confirm)
    },
    {
      q: 'How is my money protected?',
      a: 'Deposits are protected under the applicable Nigerian scheme. Every transfer requires your 4-digit PIN plus a one-time code; we alert you to new logins and let you freeze your card in-app.',  // TODO(confirm)
    },
    {
      q: 'How do I reach support?',
      a: 'From the app: Profile → Support. Response time is under 24 hours on average, including evenings and weekends.',
    },
  ],
};

export const finalCta = {
  heading: {
    title:  'Open your Jara account',
    italic: 'today.',
  },
  sub:  'Join thousands of Nigerians already banking on Jara.',
  primary:   { label: 'Open an account',          to: '/signup' },
  secondary: { label: 'I already have an account', to: '/login' },
  trust: ['24/7 Support', 'PIN + OTP on every transfer', 'Licensed & regulated'],   // last: TODO(confirm)
};

export const footer = {
  columns: [
    { heading: 'Product', links: [
      { href: '#personal', label: 'Accounts' },
      { href: '#transfers', label: 'Transfers' },
      { href: '#bills', label: 'Bills' },
      { href: '#savings', label: 'Savings' },
      { href: '#card', label: 'Cards' },
      { href: '#business', label: 'Business' },
    ]},
    { heading: 'Company', links: [
      { href: '#about',   label: 'About'   },
      { href: '#careers', label: 'Careers' },
      { href: '#press',   label: 'Press'   },
      { href: '#blog',    label: 'Blog'    },
    ]},
    { heading: 'Help', links: [
      { to:   '/profile/support', label: 'Support' },
      { href: '#faq', label: 'FAQs' },
      { href: '#security', label: 'Security' },
      { href: '#fees',  label: 'Fees' },
    ]},
    { heading: 'Legal', links: [
      { href: '#terms',   label: 'Terms'   },
      { href: '#privacy', label: 'Privacy' },
      { href: '#cookies', label: 'Cookies' },
    ]},
  ],
  smallPrint:
    '© 2026 Jara. Jara is a digital banking product. Regulatory details: TODO(confirm).',
};
