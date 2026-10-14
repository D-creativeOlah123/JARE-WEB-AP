# Jara — Design Brief 02: The Rest of the App

> **Hand this file to Claude Code after Brief 01 is merged.** It re-uses the photo pipeline, motion components, hooks and tokens built there. Read the whole thing, then work phase by phase and **stop at every checkpoint**.

---

## 0. Context you must respect

Read these before touching anything (same stack as Brief 01: React 19, Vite 8, plain JS, CSS Modules, `lucide-react`, `recharts`, `react-router-dom` 7, axios — **no new heavy deps**):

| What | Where | What it means for this brief |
|---|---|---|
| Customer shell | `src/layouts/DashboardLayout.jsx/.module.css` | The customer app is **mobile-first and renders inside a 400px phone frame** on desktop (`.stage > .phone`), full-screen under 640px. Every customer screen must look right at 360–400px width *and* feel native inside the frame. Do not turn it into a desktop dashboard. |
| Admin shell | `src/layouts/AdminLayout.jsx`, `components/admin/Sidebar.jsx`, `Topbar.jsx` | Admin **is** a desktop layout (sidebar + topbar, dark violet). Admin gets a desktop treatment. |
| Shared components | `src/components/` — `MobileHeader`, `MobileBottomNav`, `MobileKeypad`, `PinInput`, `PinDisplay`, `ConfirmModal`, `SuccessSheet`, `Skeleton`, `Spinner`, `BalanceCard`, `components/home/*`, `components/dashboard/*` | Extend, don't fork. New shared primitives go in `components/ui/`. |
| Auth wizard | `src/pages/Signup.jsx` | 7 steps: `form → create-pin → confirm-pin → pin-success → pick-channel → verify-otp → account-created`. BVN is collected on `form`. |
| Theme | `ThemeContext` (`light/dark/system`, `jara.theme`) | Every new surface must work in both. |
| Tokens / motion | `styles/tokens.css`, `styles/global.css` | Tokens only. Keyframes `jara-*`. Landing added: `Img`, `Band`, `Reveal`, `CountUp`, `TiltCard`, `CardFlip`, `useInView`, `useReducedMotion`, `useCountUp`. **Re-use them.** |
| Money | `utils/format.js` → `formatNaira` | Backend stores **kobo integers**; convert at the edge, display ₦ always. |
| Backend truths | `jara-backend/src/models/*`, `data/*` | `User` has `bvn` (11 digits) but **no `nin` field** — NIN is optional scope (see §2.1). `Account.accountNumber` = 10 digits starting with 9. `Transfer.type` = `jara \| bank`. `ServiceTransaction.type` = `airtime \| data \| electricity \| cable \| education`. `Card` = **Paystack-tokenised linked cards** (Visa/Mastercard/Verve, `last4`, `expMonth/Year`, `bank`, `isDefault`) — Jara does **not** issue its own card in the backend today. `SavingsGoal`, `Group` (pooled Ajo, `inviteCode`), `Contribution`, `Notification` (types `transfer \| contribution \| goal \| group \| service \| system`), `SupportTicket` (`account \| transfer \| payment \| card \| other`; `open \| in_progress \| resolved`), `PlatformSettings` (flags + limits), `OtpCode` (`sms \| email`). |
| Seed data | `jara-backend/src/scripts/seed.js` | Names for realistic examples: Chinedu Okoro, Aminat Bello, Tunde Adekunle, Ngozi Umeh, Yusuf Ibrahim; admin "Ada Admin". |

---

## 1. Goal

Carry the landing page's **photo-rich, realistic, Nigerian** treatment through every screen a customer or admin touches, without turning transactional screens into brochures. Inside the app, photography is used **sparingly and purposefully**: onboarding, empty states, hero areas of category pages, success moments. Transactional screens get realism through **data density, correct ₦ formatting, real provider vocabulary, receipts that look like receipts, and believable micro-interactions** — not through pictures.

Every screen must have designed **loading, empty, error, and (where relevant) offline/partial** states, in **light and dark**, and must respect `prefers-reduced-motion`.

---

## 2. Cross-cutting system work (do this first — Phase A)

### 2.1 Shared primitives → `src/components/ui/`
Build or formalise these (match existing JSDoc/prop style):
- `Button` (`variant: primary|secondary|ghost|danger`, `size`, `loading`, `iconLeft/Right`, full-width) — replaces ad-hoc `.cta` classes over time.
- `Input`, `AmountInput` (₦ prefix, thousands grouping as you type, kobo-safe `onChange(valueKobo)`), `PhoneInput` (+234 prefix, 10 digits), `OtpInput` (6 boxes, paste-aware), `Select`, `Toggle`, `Chip`.
- `Sheet` (bottom sheet inside the phone frame: drag handle, scrim `--color-scrim`, focus trap, `Esc` closes) — `SuccessSheet` and `ConfirmModal` become thin wrappers.
- `Toast` + `useToast()` (top of phone frame, 3 variants, auto-dismiss 4s, `aria-live="polite"`).
- `EmptyState` (`illustration` = small photo or duotone image slot via `Img`, `title`, `body`, `cta`).
- `ErrorState` (`title`, `detail`, `onRetry`, optional reference id) and `InlineError`.
- `Avatar` (initials on a deterministic plum/lavender palette by name hash; photo if `user.avatar`).
- `ProviderMark` (text wordmark + brand colour swatch for MTN/Airtel/Glo/9mobile/discos/TV — **no logos**).
- `BankMark` (initials + colour from a hash of `bankName`; data from `banks` service — **no logos**).
- `StatusPill` (`pending|completed|failed|open|in_progress|resolved|active|cancelled`).
- `Receipt` (see §3.7) and `ReceiptSheet`.
- `PageHeader` for admin; keep `MobileHeader` for customer.
- `ListRow` (leading avatar/mark, title, subtitle, trailing ₦ amount with sign colour, chevron).
- `Img` from Brief 01 for any photo.

### 2.2 State patterns (apply everywhere)
- **Loading:** skeletons that mirror the final layout (use `Skeleton`, never a centred spinner for page loads; spinner only inside buttons). Skeleton colours already theme-aware.
- **Empty:** `EmptyState` with a *photo-based* illustration for first-run screens (transactions, goals, groups, cards, beneficiaries, notifications, tickets) and a one-line encouragement + CTA. Photo list in §5.
- **Error:** `ErrorState` with retry; API error message from `err.response?.data?.error?.message` (existing pattern) shown verbatim when safe; otherwise a plain sentence. Never a raw stack or "Request failed with status code 500".
- **Partial:** when one of several requests fails (e.g. Dashboard loads account but not transfers), render what succeeded and an inline error card for the rest.
- **Offline:** listen to `navigator.onLine` + `online/offline` events; show a slim banner "You're offline — showing what we last loaded".
- **Optimistic UI:** mark-as-read, set-default-card, delete-beneficiary update instantly and roll back with a toast on failure.

### 2.3 Dark + light
- Audit every `*.module.css` for hard-coded hex / `white` / `black` / `rgba(0,0,0…)` and move them to tokens. Add tokens as needed (`--color-success-soft`, `--color-danger-soft`, `--color-warning-soft`, `--color-info-soft`, `--color-overlay-photo`).
- Photos in dark mode get a slightly stronger plum overlay (`--photo-overlay-dark: .28` vs `.14`).
- Charts (`recharts`) read colours from CSS variables via `getComputedStyle` in a `useChartTheme()` hook; grid lines `--color-border`; tooltips use `--color-bg-elev`.
- `DashboardLayout .stage` background `#F5F5F7` and `.gestureBar #171717` → tokens; dark mode stage = `--color-bg-dark`.

### 2.4 Motion inside the app
- Keep `route-transition`. Add: `Sheet` slide-up (`--duration-med`, `--ease-out`), list stagger (max 8 items × 40ms), balance `CountUp` on Dashboard mount (600ms, once per session), success medallion `jara-scale-in` with `--ease-spring`, PIN dot fill pulse, pull-to-refresh is **out of scope**.
- Same rules as Brief 01: transform/opacity only; reduced-motion fallback on everything; nothing runs in a hidden tab.

### 2.5 Accessibility baseline
- Every screen: one `<h1>` (visually the `MobileHeader` title), landmarks, labelled inputs, error text linked by `aria-describedby`, 44px targets, visible focus, bottom nav `aria-current="page"`.
- Amount inputs announce "Naira" via `aria-label`; PIN inputs are `type="password" inputmode="numeric"`.
- All `Sheet`s trap focus and restore it.

---

## 3. Section-by-section specs

### 3.1 Auth & onboarding — `Login`, `Signup`, `ForgotPassword`
**Layout:** on ≥ 900px, a split screen: left 45% = full-height photo (`auth-01-welcome.webp` for login, `auth-02-open-account.webp` for signup, `auth-03-reset.webp` for reset) with a plum scrim and one italic Fraunces line ("Welcome back, *let's move money.*"); right = the form card. Under 900px the photo becomes a 180px header band above the form.
**Signup wizard (keep the 7 steps, redesign the chrome):**
- Progress: 4 labelled segments (Details → PIN → Verify → Done) above the card, animated fill.
- `form` step: fields grouped "About you" (full name, DOB) / "Contact" (`PhoneInput`, email) / "Identity" (BVN with 11-digit mask, helper "Your BVN is only used to verify your identity — dial *565*0# to check it"). **NIN:** add an *optional* NIN field (11 digits) in the UI **only if** you also add `nin` to `User.js` + validator + authService; otherwise leave it out and note it in `SCOPE_NOTES.md`. Never store a fake field.
- KYC tier card: "Tier 1 — BVN verified" with limits pulled from `PlatformSettings.limits` (show ₦ figures via `formatNaira`), and a greyed "Tier 2 — add NIN + address (coming soon)".
- `create-pin` / `confirm-pin`: reuse `PinInput`/`MobileKeypad`; dots fill with a spring; mismatch shakes (6px, 300ms) and clears.
- `pick-channel`: two selectable cards (SMS to +234…, Email to …) with masked contact.
- `verify-otp`: new `OtpInput`, 60s resend countdown, dev hint stays behind `import.meta.env.DEV`.
- `account-created`: `SuccessSheet` + **the new 10-digit account number** in a copyable mono block, "Share details" button (Web Share API with clipboard fallback), small `card-01-in-hand-lagos` thumbnail.
**States:** field-level validation on blur; submit button `loading`; API error → `InlineError` above CTA; rate-limit (429) → friendly "Too many tries, wait 10 minutes"; offline banner.

### 3.2 Dashboard (Home) — `Dashboard.jsx`, `components/home/*`
- `Header`: greeting with time-of-day ("Good afternoon, Chinedu"), `Avatar`, notification bell with unread badge (count from notifications service), theme toggle in the profile menu (not here).
- `BalanceCard`: plum gradient + inline SVG noise (reuse `MiniJaraCard` surface treatment), balance `CountUp` on first mount, eye toggle to mask (`₦••••••`), account number + copy button, "Add money" / "Send" buttons. Tilt is **off** here (it's a tap surface).
- `QuickActions`: 8 tiles (Send, Airtime, Data, Electricity, TV, Education, Withdraw, More) with `ProviderMark`-style colour accents; icons from `lucide`.
- `FinancialSummary`: income vs spend this month as two `KpiCard`s + a 7-day `recharts` sparkline using `useChartTheme`.
- Goals strip: horizontally scrolling `MiniGoalCard`s (real data) with progress; empty → compact `EmptyState` "Start your first goal".
- `TransactionHistory`: `ListRow`s grouped by day ("Today", "Yesterday", "Mon 6 Oct"), `BankMark`/`ProviderMark` leading, ₦ with sign colour, status pill for pending/failed; "See all" → `/transactions`.
- **States:** skeleton mirrors layout; partial-failure inline cards; empty transactions → `EmptyState` with `empty-01-first-transaction.webp`.

### 3.3 Transfers — `Transfer`, `TransferJara`, `TransferBank`, `Withdraw`, beneficiaries
- `Transfer` hub: two large cards with small photo thumbs (`transfer-hub-01-jara.webp`, `transfer-hub-02-bank.webp`), recent beneficiaries row (`Avatar` + name + last-4 of account), "Saved beneficiaries" list with alias edit/delete (optimistic).
- `TransferBank`: bank picker `Sheet` with search + `BankMark`s (from `banks` service), 10-digit account input → **name-resolution state** ("Looking up…" shimmer → resolved name in green → error "Couldn't verify this account"), `AmountInput` with live fee line and balance-after preview, remark, **Review sheet** (from/to/amount/fee/total), PIN via `PinInput`, then `SuccessSheet` → `ReceiptSheet`.
- `TransferJara`: same flow; lookup by Jara account/phone; show recipient `Avatar`.
- `Withdraw`: cash-out to a linked bank; same review/PIN/receipt pattern.
- Limits from `PlatformSettings.limits` enforced in UI with inline messages ("Max per transfer is ₦1,000,000").
- **States:** insufficient balance (disable CTA + explain), pending (status pill + "We'll notify you"), failed with `failureReason`, duplicate-submit guard (button `loading`, ignore re-click).

### 3.4 Bills & airtime — `Airtime`, `Data`, `Electricity`, `Cable`, `Education`, `AllServices`
- `AllServices`: category grid with a 3:2 photo header band (`services-01-header.webp`) and "Recent" row.
- Shared `ServicePage` scaffold (don't copy-paste five times): header → provider picker (`ProviderMark` tiles) → recipient/meter/smartcard input with validation (phone 11 digits, meter 11–13, IUC 10) → plan/amount picker (`dataPlans`, `billProviders` packages with `priceKobo` → `formatNaira`) → review `Sheet` → PIN → success → receipt (electricity receipt shows **token** in a large mono block with copy; cable shows smartcard + package; airtime shows network + phone).
- Quick amounts for airtime (₦100 / ₦200 / ₦500 / ₦1,000 / ₦2,000 / ₦5,000).
- **States:** provider outage flag (`PlatformSettings.flags` false → tile disabled with "Temporarily unavailable"), pending verification of meter, failure with `failureReason`, offline.

### 3.5 Savings & groups — `MyJara`, `CreateGoal`, `GoalDetail`, `CreateGroup`, `JoinGroup`, `GroupDetail`
- `MyJara`: tabs Goals / Groups; top summary (total saved `CountUp`, active count); goal cards with category chips (Rent, School, Business, Travel, Emergency, Gadgets — each with a tiny duotone photo thumb from §5); groups cards with member `Avatar` stacks and next-contribution date.
- `CreateGoal`: 3-step `Sheet` wizard (What → How much & when → How to fund) with a live "You'll save ₦X every week" line; auto-save toggle.
- `GoalDetail`: progress ring (SVG, animated once), contribution history `ListRow`s, "Top up" / "Withdraw" / "Pause auto-save"; completed → confetti-free `SuccessSheet` with photo `savings-03-goal-reached.webp`.
- `CreateGroup` / `JoinGroup`: invite code in a 7-char mono input; share code via Web Share/clipboard; rules textarea.
- `GroupDetail`: pooled progress, member table (name, contributed, status), contribution schedule, activity feed from `Contribution`s, "Contribute" sheet with PIN.
- **Empty states** with photos `empty-02-first-goal.webp`, `empty-03-first-group.webp`.

### 3.6 Cards — `LinkedCards`
- Be honest to the data model: this screen manages **linked debit cards** (Paystack-tokenised) used to fund goals. Render each as a physical-looking card (reuse `MiniJaraCard` surface, scheme shown as **text** "Visa / Mastercard / Verve", bank from `card.bank`, `•••• last4`, `expMonth/expYear`), stack with slight offsets, tap to expand, default badge, "Make default" / "Remove" (ConfirmModal).
- Add-card flow: `initiateAddCard` → Paystack hosted page → `verifyAddCard` return; show a clear "You'll be charged ₦50 to verify, then refunded" line marked `TODO(confirm)`.
- A **"Jara card — coming soon"** teaser block with `card-01-in-hand-lagos.webp` thumb, "Join the waitlist" (stores interest via a support ticket category `card` unless a proper endpoint is added). Note in `SCOPE_NOTES.md`.
- **States:** empty (`empty-04-no-cards.webp`), verification pending, failed verification with retry, stub mode banner when `card.mode === 'stub'` in DEV.

### 3.7 Transaction history & receipts — `Transactions`, `Reports`, `Receipt`
- `Transactions`: sticky filter bar (All / Transfers / Bills / Savings; date range; status), search by name/reference, infinite scroll (page size 30, "Load more" fallback), day-grouped `ListRow`s, export CSV (client-side).
- `Receipt` component: looks like a real Nigerian e-receipt — Jara medallion, "Transaction Receipt", big ₦ amount, status pill, two-column details (Reference, Date/time WAT, Type, Sender, Recipient + bank, Remark, Fee, Session ID placeholder), dashed divider, footer "Jara · support@jara.ng · TODO(confirm)". Actions: **Share** (Web Share → image via `canvas` from DOM is out of scope; share text + reference), **Download PDF** via `window.print()` with a `@media print` stylesheet that prints only the receipt, **Copy reference**, **Report an issue** (prefilled support ticket).
- `Reports`: monthly spend by category (`recharts` donut + bars via `useChartTheme`), top recipients, income vs spend trend; period picker; empty → `EmptyState` "No activity this month yet".

### 3.8 Notifications — `Notifications`, `NotificationPrefs`
- Grouped by day; type icon + colour per `Notification.type`; unread dot; swipe-to-mark-read is out of scope → long-press/overflow menu instead; "Mark all read" (optimistic).
- Transaction notifications deep-link to the receipt.
- `NotificationPrefs`: `Toggle` rows (transfers, bills, savings, security, marketing) with channel chips (push/email/SMS — persist what the backend supports; otherwise mark `TODO(backend)`).

### 3.9 Support — `Support`
- Header photo band `support-01-agent.webp` (a real support agent at a desk with headset, warm). Search FAQs; FAQ accordion (same component as landing); "Open a ticket" form with `category` from the model, attachment **out of scope**; "My tickets" list with `StatusPill` and resolution text when resolved; contact row (email, phone `tel:`, WhatsApp `https://wa.me/…` marked `TODO(confirm)`).

### 3.10 Profile & settings — `Profile`, `EditProfile`, `SecurityPin`, `Settings`
- `Profile`: `Avatar` with upload (existing `avatar` base64 field, enforce ≤ 500KB, client-side resize to 512px), KYC tier badge, account number copy, grouped menu rows (Personal, Security & PIN, Linked cards, Notifications, Appearance, Support, Log out).
- `Settings` → Appearance: theme segmented control (Light / Dark / System) bound to `useTheme`; preview thumbnails.
- `SecurityPin`: change PIN with old → new → confirm; "Change password"; session list is out of scope.
- **States:** avatar upload progress + failure; save success toast.

### 3.11 Admin — `pages/admin/*`, `components/admin/*`
Desktop treatment; keep the dark-violet shell but make it a credible ops console:
- `Dashboard`: KPI row (users, active today, ₦ volume today, pending transfers, open tickets) with `CountUp`; `recharts` area chart of daily volume; recent signups + recent failed transactions tables; system flags summary.
- `Users` / `UserDetail`: dense `DirectoryTable` with `Avatar`, KYC/verified pills, suspended state; detail page with tabs (Overview, Transactions, Goals & groups, Cards, Tickets, Audit), actions (suspend/unsuspend via `ConfirmModal`, reset PIN flag `TODO(backend)`).
- `Transactions`: filters (type/status/date/amount range), reference search, row → receipt drawer (`Receipt` in a side `Sheet`).
- `Goals`, `Groups`: tables with progress bars; group detail drawer.
- `Notifications`: compose broadcast (title/body/segment) with preview card identical to the customer render.
- `Settings`: `PlatformSettings` flags as `Toggle`s with "last updated by" and limits as `AmountInput`s; danger zone for `devPromote` (DEV only).
- **States:** table skeletons, empty tables with a *small* duotone photo (`admin-empty-01.webp`), error with retry, bulk-action confirms.
- Admin photos: only the empty-state image and a subtle hero band on the dashboard (`admin-01-ops-team.webp`, 120px tall, 20% overlay).

---

## 4. Component & file structure (additions)

```
jara-frontend/src/
├─ components/ui/           # §2.1 primitives (one per file + .module.css)
├─ components/receipt/
│  ├─ Receipt.jsx / .module.css / print.css
│  └─ ReceiptSheet.jsx
├─ components/services/
│  ├─ ServicePage.jsx       # shared scaffold for 5 bill pages
│  ├─ ProviderPicker.jsx
│  ├─ PlanPicker.jsx
│  └─ ReviewSheet.jsx
├─ components/transfer/
│  ├─ BankPickerSheet.jsx
│  ├─ AccountLookup.jsx
│  ├─ FeeLine.jsx
│  └─ ReviewSheet.jsx       # (or share with services via props)
├─ components/states/
│  ├─ EmptyState.jsx / ErrorState.jsx / OfflineBanner.jsx
├─ hooks/
│  ├─ useToast.js, useOnline.js, useChartTheme.js, useInfiniteList.js
├─ data/
│  ├─ appImages.js          # same shape as landingImages.js
│  └─ emptyStates.js        # copy per screen
└─ public/images/app/       # §5
```

---

## 5. Photo shot list (app)

Same pipeline as Brief 01 (`public/images/app/`, 3 widths, LQIP in `appImages.js`, `CREDITS.md`, `PHOTOS_TODO.md`, placeholder fallback). Keep app photos **small and few** — these are accents.

| Filename (base) | Shot | Used in | Alt |
|---|---|---|---|
| `auth-01-welcome` | Young professional at a Lagos café, phone in hand, morning light | Login split | "Welcome back to Jara" |
| `auth-02-open-account` | Person at a desk filling details on phone, ID card face-down | Signup split | "Open a Jara account" |
| `auth-03-reset` | Calm portrait, phone, neutral background | Forgot password | decorative |
| `empty-01-first-transaction` | Hand holding a phone with blank screen, market blur | Dashboard/Transactions empty | decorative |
| `empty-02-first-goal` | Jar of folded naira notes on a table | Goals empty | decorative |
| `empty-03-first-group` | Friends' hands stacked together | Groups empty | decorative |
| `empty-04-no-cards` | Empty cardholder/wallet on a desk | Cards empty | decorative |
| `empty-05-no-notifications` | Quiet phone face-down on a notebook | Notifications empty | decorative |
| `empty-06-no-tickets` | Headset on a desk | Support tickets empty | decorative |
| `transfer-hub-01-jara` | Two friends bumping fists, phones in other hands | Transfer hub | decorative |
| `transfer-hub-02-bank` | Hand holding a debit card over a laptop | Transfer hub | decorative |
| `services-01-header` | Wide shot of a Lagos street with shops, wires, signage | AllServices header | decorative |
| `goal-cat-rent` / `-school` / `-business` / `-travel` / `-emergency` / `-gadgets` | Small 1:1 duotone thumbs: door key; graduation cap; shop shelf; airplane window; first-aid kit; laptop | Goal category chips | decorative |
| `savings-03-goal-reached` | Person raising arms with phone, joy | Goal completed | decorative |
| `support-01-agent` | Nigerian support agent with headset at a tidy desk | Support header | "Jara support" |
| `admin-01-ops-team` | Ops team at monitors, soft focus | Admin dashboard band | decorative |
| `admin-empty-01` | Empty desk with monitor | Admin empty tables | decorative |

---

## 6. Motion & accessibility rules (delta from Brief 01)

- Lists stagger ≤ 8 items; beyond that, no stagger.
- `Sheet` opens 280ms, closes 200ms; scrim fades; content scrolls inside the sheet, never the page behind (`overscroll-behavior: contain`).
- PIN entry: dot fill 120ms `--ease-spring`; error shake 300ms; never animate the keypad itself.
- Balance `CountUp` runs once per session (store in `sessionStorage` `jara.balanceAnimated`), never on every navigation.
- Receipt success: medallion `jara-scale-in`, then details `jara-fade-slide` 80ms later. No confetti.
- All sheets/modals: `role="dialog" aria-modal="true" aria-labelledby`, focus trap, `Esc`, restore focus.
- Every amount is also readable: `aria-label="Twenty-five thousand naira"` is **not** required; `formatNaira` output with ₦ is read correctly by screen readers — but ensure sign colour is never the only cue (add "+"/"−" and the word "Credit"/"Debit" in `aria-label` on `ListRow`).
- Tables (admin): `<table>` semantics, `scope="col"`, sortable headers as buttons with `aria-sort`.

---

## 7. Performance budget (app)

| Metric | Budget |
|---|---|
| Route-level JS per lazy chunk | ≤ 60KB gzip |
| Total new JS across the app | ≤ +120KB gzip |
| Any app photo | ≤ 60KB at 640w; empty-state thumbs ≤ 25KB |
| Dashboard TTI (throttled 4G, warm cache) | ≤ 2.0s |
| List render (100 rows) | no frame > 50ms (use windowing only if needed; `content-visibility: auto` first) |
| `recharts` | already present; load chart pages via `React.lazy()` so Home doesn't pay for it |

Convert `App.jsx` imports to `React.lazy()` per route group (auth / customer / admin) with a `Suspense` fallback that is a layout-shaped skeleton, not a spinner.

---

## 8. Don'ts (hard rules)

1. **No new heavy dependencies** (no UI kit, no animation lib, no table lib, no form lib). Tiny zero-dep utilities < 3KB only with justification.
2. **No real bank, card-scheme, telco, disco, TV, or regulator logos.** `BankMark`/`ProviderMark` text + colour only.
3. **No lorem ipsum**; all placeholder claims are real sentences flagged `TODO(confirm)` and listed in `CLAIMS_TO_CONFIRM.md`.
4. **No fake backend fields.** If the UI needs data the model lacks (NIN, Jara-issued card, session list, push channels), either implement it end-to-end (model + validator + service + route + frontend service) or leave it out and record it in `SCOPE_NOTES.md`.
5. **Don't desktop-ify the customer app.** It lives in the phone frame; respect `DashboardLayout`.
6. **No hard-coded colours/spacing**; tokens only. No `!important` except the reduced-motion guard.
7. **Don't animate layout properties**; transform/opacity only.
8. **Don't duplicate the five bill pages** — build `ServicePage` once.
9. **Don't break the API contract** (`services/*.js`) — extend, don't rename.
10. **Don't ship a screen without all four states** (loading / empty / error / success) in both themes.
11. **Don't log or display full BVN, full card numbers, OTP codes, or PINs** anywhere (mask BVN as `•••••••1234` after entry; last-4 only for cards).

---

## 9. Phases & checkpoints

At each checkpoint: `npm run build`, `npm run lint`, Vite chunk table, list of files touched, screenshots (light + dark, 375px for customer / 1440px for admin), and **stop for review**.

**Phase A — System** (§2): `components/ui/*`, states, toast, sheet, `useChartTheme`, token audit, lazy routes, `appImages.js` + image folders + placeholders.
✅ **Checkpoint A:** a `/dev/ui` route (DEV-only, behind `import.meta.env.DEV`) showing every primitive in all variants and both themes.

**Phase B — Auth & onboarding** (§3.1).
✅ **Checkpoint B:** full signup walkthrough screenshots per step; decision recorded on NIN scope.

**Phase C — Dashboard + Transactions + Receipt** (§3.2, §3.7).
✅ **Checkpoint C:** print a receipt to PDF; show partial-failure state.

**Phase D — Transfers + Withdraw + Beneficiaries** (§3.3).
✅ **Checkpoint D:** happy path + insufficient balance + failed transfer + offline.

**Phase E — Bills & airtime via `ServicePage`** (§3.4).
✅ **Checkpoint E:** all five services on one scaffold; electricity token receipt.

**Phase F — Savings & groups** (§3.5).
✅ **Checkpoint F:** goal lifecycle (create → top up → complete) + group join by code.

**Phase G — Cards, Notifications, Support, Profile/Settings** (§3.6, §3.8–3.10).
✅ **Checkpoint G:** theme switch demo; cards empty + linked states.

**Phase H — Admin** (§3.11).
✅ **Checkpoint H:** admin at 1280 / 1440 / 1920; table skeleton/empty/error.

**Phase I — Polish & QA**: axe pass per route, keyboard-only pass, reduced-motion pass, real photos swapped in, copy proofread, `CLAIMS_TO_CONFIRM.md`, `SCOPE_NOTES.md`, `PHOTOS_TODO.md` finalised.
✅ **Checkpoint I:** Definition of Done (§10).

---

## 10. Definition of Done

- [ ] Every route in `App.jsx` renders designed **loading, empty, error, success** states in **light and dark**.
- [ ] `/dev/ui` showcases all `components/ui/*` primitives; no page uses ad-hoc buttons/inputs for new work.
- [ ] Signup wizard redesigned, 7 steps intact, account number shown and copyable at the end; BVN masked after entry.
- [ ] Dashboard: balance `CountUp` once per session, grouped transactions, partial-failure handling, offline banner.
- [ ] Transfers (Jara + bank + withdraw): lookup → amount/fee → review → PIN → success → receipt; limits from `PlatformSettings`.
- [ ] Five bill services run on a single `ServicePage`; electricity receipt shows a copyable token.
- [ ] Goals + groups full lifecycle with photo-based empty states and animated progress (once).
- [ ] Cards screen is truthful (linked cards) with a clearly-labelled "Jara card — coming soon" teaser.
- [ ] `Receipt` prints cleanly to PDF via `@media print`; share/copy reference work.
- [ ] Notifications grouped, deep-link to receipts, optimistic mark-read.
- [ ] Support: FAQ, ticket form, ticket list with statuses, header photo.
- [ ] Profile/Settings: avatar upload with resize, Light/Dark/System control, PIN change.
- [ ] Admin: KPI dashboard, users + detail tabs, transactions with receipt drawer, settings bound to `PlatformSettings`.
- [ ] All photos in `public/images/app/` with 3 widths + LQIP (real or documented placeholder); `CREDITS.md`, `PHOTOS_TODO.md` complete.
- [ ] No new dependencies; routes lazy-loaded; chunk budgets met; Lighthouse mobile on `/dashboard` (logged in) Performance ≥ 85, Accessibility ≥ 95.
- [ ] No logos, no lorem ipsum, no hard-coded hex, no fake backend fields; `CLAIMS_TO_CONFIRM.md` and `SCOPE_NOTES.md` exist and are complete.
- [ ] Keyboard-only and screen-reader pass on signup, transfer, bill payment, receipt, and one admin table.
- [ ] `npm run lint` and `npm run build` clean; existing API services unchanged in signature.
