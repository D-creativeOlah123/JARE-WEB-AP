# Jara — Design Brief 01: Landing Page

> **Hand this file to Claude Code as-is.** It is a build brief, not a wish list. Read the whole thing before touching code. Work phase by phase and **stop at every checkpoint** for review.

---

## 0. Context you must respect (read the codebase first)

Before writing anything, open and read these — the brief assumes them:

| What | Where | Notes |
|---|---|---|
| Design tokens | `jara-frontend/src/styles/tokens.css` | Single source of truth. Primary plum `#9B5A91`, soft lavender `#E8DCE7`, deep `#1A0B2E` / `#10071B`. Dark mode = `:root[data-theme="dark"]`. **Every colour, radius, space, shadow, easing in new code must be a `var(--…)` from here.** Add new tokens here, never hard-code hex in a module. |
| Global motion + utilities | `jara-frontend/src/styles/global.css` | Keyframes are prefixed `jara-*`; helpers `.animate-fadeIn/.animate-fadeSlide/.animate-scaleIn/.animate-delay-*`, `.skeleton`, `.spinner`, `.progressBar`, `.route-transition`. Extend this file; don't create a parallel system. |
| Theme | `src/context/ThemeContext.jsx`, `src/hooks/useTheme.js` | 3-state light / dark / system, persisted as `jara.theme`. |
| Current landing | `src/pages/Landing.jsx` + `Landing.module.css` | Dark-only, no photos, copy positions Jara as a *savings app*. We are **repositioning** to a digital bank (accounts, transfers, bills, savings, cards). |
| Fonts | `index.html` | Fraunces (display, *italic* for headlines) + Inter (body) via Google Fonts. Keep. |
| Naira formatting | `src/utils/format.js` → `formatNaira()` | Use it for every ₦ figure, even static marketing ones. |
| Real product vocabulary | `jara-backend/src/data/*.js`, `jara-backend/src/models/*.js` | Networks: MTN, Airtel, Glo, 9mobile. Discos: IKEDC, EKEDC, AEDC… TV: DStv, GOtv, Startimes, Showmax. Services: airtime, data, electricity, cable, education. Transfers: Jara-to-Jara + bank. Savings goals + Ajo groups. Account numbers: 10 digits starting with 9. Phone: +234. BVN: 11 digits. |

**Stack facts:** React 19, Vite 8, plain JavaScript (no TypeScript), CSS Modules, `lucide-react` icons, `recharts`, `react-router-dom` v7, axios. **No animation library, no Tailwind — and you will not add any.**

---

## 1. Goal

Rebuild `/` as a long-form, photo-rich, cinematic landing page that makes a visitor *instantly* understand "this is a Nigerian digital bank I can open an account with today". It should feel like a real fintech's site (editorial photography, confident type, restrained motion), **not** a template with icon cards.

Success looks like:
- A first-time visitor can name 5 things Jara does within 10 seconds of scrolling.
- Every section pairs a **real photograph of Nigerian daily money life** with one concrete product promise and one ₦ figure.
- Motion is felt, not noticed: a card that tilts under the cursor, a balance that counts up, a transfer that travels phone-to-phone, a flip that reveals a card back.
- Lighthouse (mobile) ≥ 90 Performance, ≥ 95 Accessibility, 100 Best Practices.

---

## 2. Art direction

**Mood:** "Lagos at golden hour". Warm, confident, lived-in. Photography is the hero; the plum brand sits on top of it, never fights it.

**Photography rules**
- Real people, real Nigerian settings (markets, petrol stations, POS kiosks, ATMs, campus, family living rooms, small shops, bus parks, offices). Natural light, shallow depth of field, candid over posed.
- Faces are fine but **never** show anyone's real card number, real bank app, real ID, or real receipt. Any screen in a photo gets a Jara UI overlay composited in CSS (see §6 "screen-in-photo").
- Colour grade: warm highlights, plum-tinted shadows. Apply a consistent CSS treatment via a `.photo` class: `filter: saturate(1.05) contrast(1.02)` + a plum gradient overlay at 8–16% so every shot feels like one shoot.
- Aspect ratios: hero 16:9 (desktop) / 4:5 (mobile), mosaic tiles 1:1 and 4:5, band images 3:2. Always `object-fit: cover` with a per-image `object-position` so faces survive cropping.

**Typography**
- Headlines: Fraunces, *italic* for the emphasised phrase (existing `.heroTitleItalic` gradient idea stays), `opsz` high, tight tracking (`-0.02em`), `line-height: 1.02`. Sizes: hero 64/48/40px (desktop/tablet/mobile), section 44/36/30px.
- Body: Inter 16–18px, `line-height: 1.55`, max measure 60ch.
- Numbers: Inter with `font-variant-numeric: tabular-nums` everywhere a ₦ figure animates.

**Colour & surfaces**
- The page alternates **dark bands** (hero, stats, security, final CTA — `--color-bg-dark` family) and **light bands** (features, stories, FAQ — `--color-bg` / `--color-bg-subtle`). In dark theme, light bands map to `--color-bg-elev` so the page still alternates.
- ₦ figures use `--color-primary-light` on dark, `--color-primary-dark` on light.
- Glass surfaces (nav, floating chips): `backdrop-filter: blur(16px)`, 1px `rgba(255,255,255,.12)` border on dark, `--color-border` on light. Provide a non-blur fallback.

**No-template rules**
- No 3-column "icon + title + two lines" grids. If a feature needs listing, it gets a photo, a stat, or a live mini-UI.
- No stock "diverse team high-fiving in an office", no 3D illustration blobs, no isometric phones floating in space.
- No lorem ipsum; every string is final-quality copy in Nigerian English (see §7).

---

## 3. Page structure (section-by-section spec)

All sections are full-bleed with a 1180px inner container (reuse `.container`). Reduced-motion variants are mandatory for every animation (§8).

### 3.0 Nav — `LandingNav`
- Sticky, 64px, transparent over hero → glass once scrolled > 24px (toggle a class via a scroll listener with `requestAnimationFrame` throttling).
- Left: "J" medallion + *Jara* wordmark (existing). Centre (desktop): Personal · Business · Cards · Savings · Help. Right: theme toggle (sun/moon via `useTheme`), **Log in** (ghost), **Open an account** (solid, → `/signup`).
- Mobile: hamburger → full-screen sheet with the same links, large tap targets (48px), focus-trapped, `Esc` closes.

### 3.1 Hero carousel — `HeroCarousel`
Two-column on desktop (7/5), stacked on mobile.

**Left column (text, static across slides but the eyebrow + stat chip change per slide):**
- Eyebrow (per slide): e.g. "Everyday payments".
- H1 (fixed): **"Your money, your way.** *Banking that moves at Lagos speed.*" (second line italic gradient).
- Sub: "Open a full Jara account in 3 minutes with your BVN. Send money, pay bills, save with friends, and spend with your Jara card — all from one app."
- CTAs: **Open an account** (solid) · **See how it works** (ghost, smooth-scrolls to §3.9).
- Trust row (small): "Instant transfers to all Nigerian banks · 24/7 in-app support · PIN + OTP on every transfer".

**Right column:** full-bleed photo carousel with a **floating `TiltCard`** (the Jara debit card, §3.7 component) overlapping the bottom-left corner, and a **`CountUp` balance chip** top-right ("Available balance ₦0 → ₦248,500.00" over 1.6s on first view).

**Slides (5, each = photo + caption chip + stat):**
| # | Photo file | Caption chip | Stat chip |
|---|---|---|---|
| 1 | `hero-01-market-card.webp` | "Tap to pay at Balogun Market" | "₦1,250 · Approved" |
| 2 | `hero-02-phone-transfer.webp` | "Send to any bank in seconds" | "₦45,000 sent to GTBank · 2s" |
| 3 | `hero-03-shop-owner-alert.webp` | "Credit alerts you can trust" | "+₦18,500 from Chinedu O." |
| 4 | `hero-04-family-saving.webp` | "Save together with Ajo groups" | "Family Rent Fund · 72%" |
| 5 | `hero-05-petrol-station.webp` | "Fuel up, pay with your card" | "₦32,000 · Mobil Lekki" |

**Behaviour:** CSS `scroll-snap` track + `useCarousel` hook (autoplay 6s, pause on hover/focus/`visibilitychange`, swipe, arrow keys, dots with `aria-current`, prev/next buttons 44px). Crossfade captions with `jara-fade-slide`. Ken-Burns on the active photo (`scale(1) → scale(1.06)` over 6s, `--ease-out`) — disabled under reduced motion. Preload slide 1 only (`<link rel="preload" as="image">` injected in `index.html`), lazy-load 2–5.

### 3.2 Trust strip — `TrustStrip`
Single row, light band, 56px: "Licensed & regulated" · "Deposits protected" · "256-bit encryption" · "BVN-verified accounts" · "Powered by Paystack rails". Text only, `lucide` glyphs 16px. **Copy must be confirmed by Olalekan before launch** — put `// TODO(confirm-claims)` next to the regulatory lines.

### 3.3 Everyday money mosaic — `PhotoMosaic`
Heading: "Made for how Nigerians *actually* pay." Sub: one line.
A 6-tile CSS grid (desktop 4×2 with two 2×1 spans; mobile 2-col). Each tile = photo + bottom-left glass label + ₦ micro-stat that **counts up when the tile enters view** (`useInView` + `CountUp`):
1. `mosaic-01-pos-agent.webp` — "Cash in / cash out at 40,000+ POS agents" · "₦5,000 withdrawn"
2. `mosaic-02-atm-withdrawal.webp` — "Withdraw at any ATM nationwide" · "₦20,000"
3. `mosaic-03-student-school-fees.webp` — "Pay school fees in-app" · "₦185,000 · UNILAG"
4. `mosaic-04-airtime-on-the-go.webp` — "Airtime & data, every network" · "₦2,000 MTN"
5. `mosaic-05-danfo-transport.webp` — "Transport, tolls, everyday spend" · "₦700"
6. `mosaic-06-electricity-meter.webp` — "Light bills, prepaid or postpaid" · "₦15,000 IKEDC"

Hover (pointer devices only): photo scales 1.03, label lifts 4px. Tap on touch does nothing destructive.

### 3.4 Transfers — `TransferShowcase`
Light band, two columns. **Left:** H2 "Send money like sending a text." Bullets with real limits from `PlatformSettings` defaults (₦100 min, ₦1,000,000 max per transfer, "free Jara-to-Jara, ₦10 to other banks" — mark fee as `TODO(confirm)`). CTA "Start sending".
**Right:** `TransferAnimation` — two phone frames (reuse the phone-frame styling idea from `DashboardLayout.module.css`, scaled to 220px) side by side over `transfers-01-two-friends-phones.webp` (blurred/darkened to 60%). On enter-view: left phone shows "Send ₦25,000 to Aminat Bello · 9123456789" → PIN dots fill → a plum ₦ coin token travels along an SVG path to the right phone → right phone shows a credit-alert toast "+₦25,000 from Tunde A." → both show a green check. Total 2.8s, replays on click of "Replay" button, auto-replays every 9s only while in view. Pure CSS/SVG + `requestAnimationFrame`; no library.

### 3.5 Bills & airtime — `BillsShowcase`
Dark band. H2 "Every bill, one tap." Left: `bills-01-student-paying-fees.webp` (3:2). Right: a **live-looking provider grid** using brand *colours* (from `networks.js`) and *text wordmarks* — **no logos** (§10). Tiles: MTN · Airtel · Glo · 9mobile · IKEDC · EKEDC · AEDC · DStv · GOtv · Startimes · Showmax · WAEC/JAMB (education). Each tile shows a tiny recent-payment line ("₦2,000 · 2m ago") with a slow stagger-in. Footnote: "Instant value. Receipts for everything."

### 3.6 Savings & Ajo — `SavingsShowcase`
Light band. H2 "Save alone. *Save together.*" Photo `savings-01-family-planning.webp` full-height left. Right: two stacked mini-UIs rendered from real components' look (do **not** import dashboard components; build lightweight marketing replicas in `components/landing/mini/`):
- Goal card "New Laptop · ₦450,000 target" with progress bar animating 0→68% on enter-view and the saved amount counting up.
- Ajo group "Umeh Family Rent" — 5 member avatars (initials, plum palette), "₦1,200,000 of ₦1,800,000", next contribution "Fri 10 Oct · ₦50,000". Secondary photo `savings-02-market-women-ajo.webp` as a small inset.

### 3.7 The Jara card — `CardShowcase` + `TiltCard` + `CardFlip`
Dark band, cinematic. H2 "A card that goes everywhere you do."
- **Left:** `card-01-in-hand-lagos.webp` (4:5) — a plum Jara card held up against a Lagos street/bridge backdrop.
- **Right:** `CardFlip` — the card rendered in pure CSS (gradient `--gradient-primary`, subtle noise texture via inline SVG `feTurbulence`, EMV chip shape, contactless glyph, "JARA" wordmark in Fraunces italic, name "CHINEDU OKORO", masked number "•••• •••• •••• 4821", "VALID THRU 09/29"). Back: magnetic strip, signature panel, "CVV •••". `TiltCard` wraps it: pointer-driven `rotateX/rotateY` up to ±12°, glossy highlight `radial-gradient` that follows the pointer, spring back on leave (`--ease-spring`). Click/tap or **Flip** button toggles front/back (`rotateY(180deg)`, 600ms, `preserve-3d`). Keyboard: focusable, `Enter`/`Space` flips.
- Bullets: "Virtual card in seconds · Physical card delivered in Lagos/Abuja/PH · Freeze from the app · Spend limits you control". Mark physical delivery as `TODO(confirm)`.
- Network badge: generic "Verve / Mastercard-ready" text only — **no scheme logos**.

### 3.8 Business — `BusinessShowcase`
Light band. H2 "Built for the people who build Nigeria." Photo `business-01-shop-owner-alert.webp` (small business owner looking at phone with a credit alert; composite the Jara alert toast over the screen in CSS). Right: `AlertToastDemo` — a stack of 3 alert toasts dropping in one after the other ("+₦7,500 from Ngozi U. · POS", "+₦120,000 from Invoice #0421", "+₦3,200 from Yusuf I."), each with a soft haptic-style scale pulse. Secondary photo `business-02-pos-agent-kiosk.webp` inset. Bullets: business account, bulk transfers, POS settlement same-day, team access. CTA "Talk to sales" (→ `/profile/support` for now, or `mailto:`).

### 3.9 How it works — `HowItWorks`
Light band, numbered 3 steps in a horizontal timeline that draws its connecting line on scroll (SVG `stroke-dashoffset`):
1. "Enter your phone, email and BVN" — photo thumb `steps-01-bvn-entry.webp`
2. "Set your 4-digit transfer PIN, confirm by OTP" — `steps-02-otp.webp`
3. "You're banking. Get your 10-digit Jara account number instantly" — `steps-03-account-ready.webp`
Mirror the real `Signup.jsx` wizard order (form → PIN → OTP → account created).

### 3.10 Security — `SecurityBand`
Dark band, photo `security-01-woman-confident-phone.webp` darkened with plum overlay. Four short lines with icons: BVN-verified identity · PIN + OTP on every transfer · Device & login alerts · Freeze card instantly. One line of honest copy, no fear-mongering.

### 3.11 Stories (testimonials) — `Stories`
Light band. Three cards, each with a real portrait (`stories-01-amaka.webp`, `stories-02-ibrahim.webp`, `stories-03-tolu.webp`), name, city, one-line role ("Fashion retailer, Aba"), 2–3 sentence quote in Nigerian English, and a tiny ₦ detail ("Saved ₦600,000 for new sewing machines"). Carousel on mobile (reuse `useCarousel`). **These are illustrative testimonials — add a visually-hidden note and a footnote "Stories are illustrative" until real ones exist.**

### 3.12 Numbers — `StatsBand`
Dark band, 4 big `CountUp` figures on enter-view: "₦5.2B+ moved", "50,000+ accounts", "40,000+ POS agents", "99.9% uptime". Keep the existing figures from the old hero; mark `TODO(confirm)`.

### 3.13 FAQ — `FAQ`
Light band, 8 accordions (`<details>`/`<summary>` for free a11y, animated with `grid-template-rows: 0fr→1fr`). Questions: Is Jara a bank? · What do I need to open an account? · Is there a minimum balance? · How fast are transfers? · What are the fees? · Can I get a physical card? · How is my money protected? · How do I reach support? Pull the "A bank transfer failed…" style answers from `Support.jsx` FAQS for tone.

### 3.14 Final CTA — `FinalCTA`
Dark band with `cta-01-friends-celebrating.webp` as a blurred backdrop. H2 "Open your Jara account *today*." Sub + **Open an account** + "I already have an account". Trust row from the old landing (keep "24/7 Support", replace "CBN Licensed" with `TODO(confirm)` placeholder copy "Licensed & regulated").

### 3.15 Footer — `LandingFooter`
4 columns: Product (Accounts, Transfers, Bills, Savings, Cards, Business) · Company (About, Careers, Press, Blog) · Help (Support, FAQs, Security, Fees) · Legal (Terms, Privacy, Cookies). Theme toggle repeated. Small print: "© 2026 Jara. Jara is a digital banking product. Regulatory details: TODO(confirm)." Social icons from `lucide`.

---

## 4. Photo shot list

Create `jara-frontend/public/images/landing/` and use **exactly** these filenames. Serve WebP (plus AVIF where cheap) in 3 widths via `<picture>` + `srcset` (`-640`, `-1280`, `-1920` suffixes, e.g. `hero-01-market-card-1280.webp`). Every image gets a 24px-wide blurred LQIP as an inline `data:` URI background (generated once, stored in `src/data/landingImages.js` alongside `alt`, `objectPosition`, and intrinsic `width/height` to prevent CLS).

| Filename (base) | Shot description (Nigerian context) | Orientation | Alt text |
|---|---|---|---|
| `hero-01-market-card` | Woman tapping a plum card on a POS terminal at a busy Lagos market stall; vendor smiling, produce in frame | 16:9 / 4:5 | "A woman pays with a Jara card at a market stall" |
| `hero-02-phone-transfer` | Close-up of hands holding a phone mid-transfer, bus park or street in soft-focus background | 16:9 / 4:5 | "A man sends money on his phone" |
| `hero-03-shop-owner-alert` | Small shop owner behind counter checking a credit alert, shelves of goods | 16:9 / 4:5 | "A shop owner receives a transfer alert" |
| `hero-04-family-saving` | Family of four at a dining table with a phone between them, warm home light | 16:9 / 4:5 | "A family saves together on Jara" |
| `hero-05-petrol-station` | Attendant handing a POS to a driver at a filling station at dusk | 16:9 / 4:5 | "A driver pays for fuel with a card" |
| `mosaic-01-pos-agent` | POS agent under a branded umbrella/kiosk handing cash to a customer | 1:1 | "A POS agent serves a customer" |
| `mosaic-02-atm-withdrawal` | Hand taking naira notes from an ATM slot (no bank branding visible) | 4:5 | "Cash withdrawal at an ATM" |
| `mosaic-03-student-school-fees` | University student in a lecture-hall corridor paying on phone, backpack | 4:5 | "A student pays school fees on their phone" |
| `mosaic-04-airtime-on-the-go` | Okada/bike rider or commuter topping up airtime on phone | 1:1 | "Buying airtime on the go" |
| `mosaic-05-danfo-transport` | Yellow danfo bus window, passenger with phone | 1:1 | "Paying for transport" |
| `mosaic-06-electricity-meter` | Prepaid electricity meter with hand entering token | 1:1 | "Loading an electricity token" |
| `transfers-01-two-friends-phones` | Two friends on a rooftop/balcony comparing phones, laughing | 3:2 | "Two friends sending money to each other" |
| `bills-01-student-paying-fees` | Parent and child at a school gate with phone | 3:2 | "A parent pays school fees" |
| `savings-01-family-planning` | Couple on a couch with notebook and phone, planning | 4:5 | "A couple plans their savings" |
| `savings-02-market-women-ajo` | Group of market women in a circle, one holding a phone (Ajo/esusu) | 1:1 | "A savings group meeting" |
| `card-01-in-hand-lagos` | Hand holding a plum card up against Third Mainland Bridge / Lagos skyline, golden hour | 4:5 | "A Jara card held up against the Lagos skyline" |
| `business-01-shop-owner-alert` | Boutique/provisions store owner smiling at phone | 3:2 | "A business owner checks a payment alert" |
| `business-02-pos-agent-kiosk` | Close-up of POS terminal printing a receipt | 1:1 | "A POS terminal prints a receipt" |
| `steps-01-bvn-entry` | Person typing on phone, clean desk | 1:1 | "Entering details to open an account" |
| `steps-02-otp` | Phone showing an incoming SMS, hand ready | 1:1 | "Receiving a verification code" |
| `steps-03-account-ready` | Person smiling at phone, relief/joy | 1:1 | "Account opened" |
| `security-01-woman-confident-phone` | Woman in office/café, calm, phone in hand, low-key lighting | 16:9 | "Banking securely on Jara" |
| `stories-01-amaka` / `-02-ibrahim` / `-03-tolu` | Portraits: retailer in Aba, trader in Kano, student in Ibadan — natural light, direct eye contact | 1:1 | "Portrait of {name}" |
| `cta-01-friends-celebrating` | Friends celebrating at a Lagos rooftop at night, bokeh | 16:9 | decorative (`alt=""`) |

**Sourcing:** use only photos with a license that allows commercial use without attribution (Unsplash License, Pexels License, or the owner's own shoot). Record the source URL + license per file in `public/images/landing/CREDITS.md`. If you cannot source a shot, **do not substitute a generic non-Nigerian stock photo** — render a tasteful placeholder (plum duotone gradient + the alt text in small caps) using the same `<Img>` component and list the gap in `public/images/landing/PHOTOS_TODO.md` so Olalekan can drop in the real file later without code changes.

---

## 5. Component & file structure

```
jara-frontend/src/
├─ pages/
│  └─ Landing.jsx                      # composes sections only; < 80 lines
├─ components/landing/
│  ├─ LandingNav.jsx / .module.css
│  ├─ HeroCarousel.jsx / .module.css
│  ├─ TrustStrip.jsx / .module.css
│  ├─ PhotoMosaic.jsx / .module.css
│  ├─ TransferShowcase.jsx / .module.css
│  ├─ BillsShowcase.jsx / .module.css
│  ├─ SavingsShowcase.jsx / .module.css
│  ├─ CardShowcase.jsx / .module.css
│  ├─ BusinessShowcase.jsx / .module.css
│  ├─ HowItWorks.jsx / .module.css
│  ├─ SecurityBand.jsx / .module.css
│  ├─ Stories.jsx / .module.css
│  ├─ StatsBand.jsx / .module.css
│  ├─ FAQ.jsx / .module.css
│  ├─ FinalCTA.jsx / .module.css
│  ├─ LandingFooter.jsx / .module.css
│  ├─ motion/
│  │  ├─ CountUp.jsx                   # rAF-driven, tabular-nums, formatNaira
│  │  ├─ TiltCard.jsx                  # pointer tilt + gloss, spring back
│  │  ├─ CardFlip.jsx                  # 3D flip, keyboard-accessible
│  │  ├─ TransferAnimation.jsx / .module.css
│  │  ├─ AlertToastDemo.jsx / .module.css
│  │  └─ Reveal.jsx                    # wraps children; fades/slides on useInView
│  ├─ mini/                            # marketing replicas, NOT app components
│  │  ├─ MiniPhone.jsx / .module.css
│  │  ├─ MiniGoalCard.jsx
│  │  ├─ MiniAjoCard.jsx
│  │  └─ MiniJaraCard.jsx              # the CSS card face/back
│  └─ ui/
│     ├─ Img.jsx                       # <picture>, srcset, LQIP, width/height, lazy
│     ├─ SectionHeading.jsx            # eyebrow + H2 (italic span) + sub
│     └─ Band.jsx                      # tone="dark|light" full-bleed wrapper
├─ hooks/
│  ├─ useInView.js                     # IntersectionObserver, once: true option
│  ├─ useReducedMotion.js
│  ├─ useCarousel.js                   # autoplay/pause/swipe/keys/dots
│  └─ useCountUp.js
├─ data/
│  ├─ landing.js                       # ALL copy, slides, FAQs, stories, stats
│  └─ landingImages.js                 # { key: { base, alt, position, w, h, lqip } }
└─ styles/
   ├─ tokens.css                       # ADD: --landing-* tokens if needed (overlay %, glass)
   └─ global.css                       # ADD: jara-ken-burns, jara-draw-line, jara-coin-travel keyframes
```

Rules: one component per file; CSS Modules only; props documented in a JSDoc block at the top of each component (match the existing codebase style); no inline style objects except for truly dynamic values (`--x`, `--y` custom properties set from pointer events).

---

## 6. Motion spec

| Element | Trigger | Motion | Duration / easing | Reduced-motion fallback |
|---|---|---|---|---|
| Hero photo | slide active | Ken-Burns `scale 1→1.06` | 6000ms `--ease-out` | static |
| Hero captions | slide change | `jara-fade-slide` | `--duration-med` | instant swap |
| Balance chip | first in-view | `CountUp` 0→₦248,500.00, ease-out cubic | 1600ms | final value shown immediately |
| TiltCard | pointer move | `rotateX/Y ±12°`, gloss follows pointer | 80ms lerp per frame; spring back 500ms `--ease-spring` | no tilt; gloss static |
| CardFlip | click/Enter | `rotateY 0→180`, `preserve-3d` | 600ms `--ease-out` | opacity crossfade 150ms |
| Mosaic tiles | in-view (stagger 60ms) | `jara-fade-slide` + count-up | `--duration-med` | fade only |
| TransferAnimation | in-view, then every 9s | PIN dots → coin along SVG path → toast → checks | 2800ms total | shows final frame (both checks + toast) |
| AlertToastDemo | in-view | 3 toasts drop in, 400ms apart, scale pulse 1→1.03→1 | `--ease-spring` | all three visible, no pulse |
| HowItWorks line | in-view | SVG `stroke-dashoffset` draw | 900ms `--ease-out` | drawn |
| StatsBand | in-view | 4 count-ups | 1400ms | final values |
| FAQ | toggle | `grid-template-rows 0fr→1fr` | `--duration-med` | instant |
| Nav | scroll > 24px | bg → glass, shadow | `--duration-fast` | same (no motion involved) |
| Section reveal | in-view, once | `Reveal` 12px rise + fade | `--duration-slow` | opacity only |

Implementation rules:
- Animate **only** `transform` and `opacity` (plus `grid-template-rows` for FAQ). Never animate `top/left/width/height/box-shadow`.
- All in-view triggers fire **once** and only when ≥ 35% visible.
- `useReducedMotion()` reads `prefers-reduced-motion: reduce`; every motion component checks it. Also add a global guard in `global.css`: `@media (prefers-reduced-motion: reduce) { .animate-*, .route-transition { animation: none !important } }`.
- No animation runs while the tab is hidden (`document.visibilityState`).
- `will-change` only on elements actively animating; remove after.

---

## 7. Copy & content rules

- Nigerian English, warm and plain. "Send money", not "Initiate a disbursement". "Light bill", "airtime", "school fees", "POS agent", "Ajo" are the words users use.
- **₦ on every money figure**, formatted with `formatNaira`; kobo shown only in the hero balance (`decimals: 2`).
- Use names from the seed data for realism: Chinedu Okoro, Aminat Bello, Tunde Adekunle, Ngozi Umeh, Yusuf Ibrahim. Account numbers in the 9XXXXXXXXX pattern.
- All copy lives in `src/data/landing.js`; components never hard-code strings.
- Regulatory/fee/delivery claims are **placeholders** flagged `TODO(confirm)` in code and listed in a `CLAIMS_TO_CONFIRM.md` at the frontend root.

---

## 8. Accessibility rules

- Semantic landmarks: `<header>`, `<main>`, one `<h1>`, sequential `<h2>`s, `<footer>`, `<nav aria-label>`.
- Carousel: `role="region" aria-roledescription="carousel" aria-label="Jara in everyday life"`, slides `role="group" aria-roledescription="slide" aria-label="1 of 5"`, live region `aria-live="polite"` for the caption, play/pause button, dots are real `<button>`s.
- Every interactive element: 44×44px min, visible `:focus-visible` (already in `global.css`), keyboard-operable (tilt card, flip, carousel, FAQ, mobile menu).
- Contrast ≥ 4.5:1 for text over photos — always put text on a solid/gradient scrim, never raw on a photo. Test the worst-case tile in both themes.
- Count-ups: wrap in `aria-live="off"` and render the final value in a visually-hidden span so screen readers never hear the scramble.
- Decorative photos use `alt=""`; informative ones use the alt from §4.
- Mobile menu: focus trap, returns focus to the hamburger on close, `aria-expanded`.
- No autoplaying video, no sound.

---

## 9. Performance budget (mobile, throttled 4G)

| Metric | Budget |
|---|---|
| LCP (hero slide 1 image) | ≤ 2.5s |
| CLS | ≤ 0.05 (all `<Img>` have intrinsic `width/height`) |
| INP | ≤ 200ms |
| Landing JS (gzip) | ≤ 90KB *additional* over current app shell |
| Hero image (1280w WebP) | ≤ 180KB; each other image ≤ 120KB |
| Initial image payload above the fold | ≤ 450KB |
| Total page weight at full scroll | ≤ 2.5MB |
| Fonts | no new families; keep the existing Google Fonts link, add `font-display: swap` (already via `&display=swap`) |
| Requests above the fold | ≤ 25 |

Techniques: `loading="lazy"` + `decoding="async"` below the fold, `fetchpriority="high"` on hero slide 1, `<picture>` with AVIF→WebP, LQIP backgrounds, `content-visibility: auto` + `contain-intrinsic-size` on sections below §3.4, lazy `React.lazy()` for `Stories`, `FAQ`, `FinalCTA` chunks. Run `npm run build` and read the Vite output table — if any chunk > 150KB gzip, split it.

---

## 10. Don'ts (hard rules)

1. **No new heavy dependencies.** No framer-motion, GSAP, Swiper, Embla, Lottie, three.js, AOS, react-spring, Tailwind, styled-components. Hooks + CSS + SVG only. (Tiny, zero-dep utilities < 3KB are allowed only with a one-line justification in the PR notes.)
2. **No real bank, card-scheme, telco, disco, or TV logos.** Text wordmarks + brand colours only. No "Download on the App Store"/"Get it on Google Play" badges — there is no app store listing.
3. **No lorem ipsum, no "Lorem", no `TODO copy`** in rendered output. Placeholder claims are real sentences flagged `TODO(confirm)` in code.
4. **No non-Nigerian or generic stock photography.** Follow §4; use the placeholder path if a shot is missing.
5. **No hard-coded colours/spacing** — tokens only. No `px` font sizes outside the type scale except the hero sizes defined in §2.
6. **Don't import app components** (`BalanceCard`, `QuickActions`, etc.) into the landing — build `mini/` replicas so the two can evolve independently.
7. **Don't break existing routes** (`/login`, `/signup`, `*` fallback → Landing). Don't touch `DashboardLayout`, `AdminLayout`, or any `pages/` other than `Landing.jsx`.
8. **Don't animate layout properties.** Transform/opacity only.
9. **Don't fabricate regulatory status** as fact — placeholder + `TODO(confirm)`.
10. **Don't ship a dark-only page.** Both themes must pass §8 contrast.

---

## 11. Phases & checkpoints

Work in order. At each checkpoint: `npm run build`, `npm run lint`, paste the Vite chunk table, list files touched, and **stop for review** before continuing.

**Phase 1 — Foundation (no visible change yet)**
- `data/landing.js`, `data/landingImages.js` (with placeholder LQIPs), `ui/Img.jsx`, `ui/Band.jsx`, `ui/SectionHeading.jsx`, hooks (`useInView`, `useReducedMotion`, `useCarousel`, `useCountUp`), `motion/Reveal.jsx`, `motion/CountUp.jsx`, image folder + `CREDITS.md` + `PHOTOS_TODO.md` scaffolds, new keyframes in `global.css`, any new tokens.
- ✅ **Checkpoint 1:** show the `Img` component rendering a placeholder in both themes.

**Phase 2 — Above the fold**
- `LandingNav`, `HeroCarousel` (with photos or placeholders), `TiltCard`, `MiniJaraCard`, balance `CountUp` chip, `TrustStrip`. Replace the old hero in `Landing.jsx`.
- ✅ **Checkpoint 2:** screenshots desktop + mobile, both themes; Lighthouse mobile run.

**Phase 3 — Everyday money + transfers + bills**
- `PhotoMosaic`, `TransferShowcase` + `TransferAnimation`, `BillsShowcase`.
- ✅ **Checkpoint 3:** record a short screen capture of the transfer animation; confirm reduced-motion fallback.

**Phase 4 — Savings, card, business**
- `SavingsShowcase` + `MiniGoalCard` + `MiniAjoCard`, `CardShowcase` + `CardFlip`, `BusinessShowcase` + `AlertToastDemo`.
- ✅ **Checkpoint 4:** keyboard walkthrough video/notes of tilt + flip.

**Phase 5 — Trust & close**
- `HowItWorks`, `SecurityBand`, `Stories`, `StatsBand`, `FAQ`, `FinalCTA`, `LandingFooter`. Delete the old `Landing.module.css` rules no longer used.
- ✅ **Checkpoint 5:** full-page screenshots both themes, Lighthouse ≥ 90/95/100, bundle table, `CLAIMS_TO_CONFIRM.md`, `PHOTOS_TODO.md`.

**Phase 6 — Polish pass**
- Real photos swapped in for any placeholders Olalekan has supplied; object-position tuning; copy proofread; axe DevTools pass; 320px, 375px, 768px, 1024px, 1440px, 1920px layouts checked.
- ✅ **Checkpoint 6:** Definition of Done (§12) ticked line by line.

---

## 12. Definition of Done

- [ ] `/` renders the full 16-section page; `Landing.jsx` is a thin composer.
- [ ] All 24 image slots exist in `public/images/landing/` with 3 widths each (real or documented placeholder); `CREDITS.md` and `PHOTOS_TODO.md` are complete.
- [ ] Every ₦ figure goes through `formatNaira`; ₦ appears on every money string.
- [ ] Hero carousel: autoplay, pause on hover/focus/hidden tab, swipe, arrows, dots, keyboard, `aria-roledescription`.
- [ ] TiltCard, CardFlip, TransferAnimation, AlertToastDemo, CountUp, HowItWorks line-draw all work and all respect `prefers-reduced-motion`.
- [ ] Light **and** dark theme both pass 4.5:1 text contrast on every band (checked with axe/Lighthouse).
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices 100, SEO ≥ 95.
- [ ] CLS ≤ 0.05; LCP ≤ 2.5s on throttled mobile; landing JS ≤ +90KB gzip.
- [ ] No new dependencies in `package.json` (diff is empty or justified).
- [ ] No logos, no store badges, no lorem ipsum, no hard-coded hex, no non-Nigerian stock.
- [ ] All copy in `src/data/landing.js`; `CLAIMS_TO_CONFIRM.md` lists every `TODO(confirm)`.
- [ ] `npm run lint` clean; `npm run build` clean; existing routes untouched and working.
- [ ] Responsive at 320 / 375 / 768 / 1024 / 1440 / 1920 with no horizontal scroll.
- [ ] Keyboard-only walkthrough of the whole page completed; focus never lost.
