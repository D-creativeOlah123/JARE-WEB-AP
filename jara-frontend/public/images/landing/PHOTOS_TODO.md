# Landing photos — still-to-source list

Every slot below is currently rendering a duotone placeholder via `<Img>`.
Dropping the real file into `public/images/landing/` at 3 widths and flipping
`available: true` in `src/data/landingImages.js` is enough — no code changes.

## Required file set per slot
For each `<base>` below, drop:

- `<base>-640.webp`
- `<base>-1280.webp`
- `<base>-1920.webp`

Optional: AVIF siblings at the same widths; `landingImages.js` already supports
`formats: ['avif', 'webp']` per entry.

## Slots waiting on a photo

### Hero carousel (5)
- [ ] `hero-01-market-card` — Woman tapping a plum card on a POS terminal at a busy Lagos market stall; vendor smiling, produce in frame.
- [ ] `hero-02-phone-transfer` — Close-up of hands holding a phone mid-transfer, bus park or street in soft-focus background.
- [ ] `hero-03-shop-owner-alert` — Small shop owner behind counter checking a credit alert, shelves of goods.
- [ ] `hero-04-family-saving` — Family of four at a dining table with a phone between them, warm home light.
- [ ] `hero-05-petrol-station` — Attendant handing a POS to a driver at a filling station at dusk.

### Everyday-money mosaic (6)
- [ ] `mosaic-01-pos-agent` — POS agent under a branded umbrella/kiosk handing cash to a customer.
- [ ] `mosaic-02-atm-withdrawal` — Hand taking naira notes from an ATM slot (no bank branding visible).
- [ ] `mosaic-03-student-school-fees` — University student in a lecture-hall corridor paying on phone, backpack.
- [ ] `mosaic-04-airtime-on-the-go` — Okada/bike rider or commuter topping up airtime on phone.
- [ ] `mosaic-05-danfo-transport` — Yellow danfo bus window, passenger with phone.
- [ ] `mosaic-06-electricity-meter` — Prepaid electricity meter with hand entering token.

### Showcases
- [ ] `transfers-01-two-friends-phones` — Two friends on a rooftop/balcony comparing phones, laughing.
- [ ] `bills-01-student-paying-fees` — Parent and child at a school gate with phone.
- [ ] `savings-01-family-planning` — Couple on a couch with notebook and phone, planning.
- [ ] `savings-02-market-women-ajo` — Group of market women in a circle, one holding a phone (Ajo/esusu).
- [ ] `card-01-in-hand-lagos` — Hand holding a plum card up against Third Mainland Bridge / Lagos skyline, golden hour.
- [ ] `business-01-shop-owner-alert` — Boutique/provisions store owner smiling at phone.
- [ ] `business-02-pos-agent-kiosk` — Close-up of POS terminal printing a receipt.

### How it works (3 small thumbs)
- [ ] `steps-01-bvn-entry` — Person typing on phone, clean desk.
- [ ] `steps-02-otp` — Phone showing an incoming SMS, hand ready.
- [ ] `steps-03-account-ready` — Person smiling at phone, relief/joy.

### Security + stories + CTA
- [ ] `security-01-woman-confident-phone` — Woman in office/café, calm, phone in hand, low-key lighting.
- [ ] `stories-01-amaka` — Portrait: Amaka, fashion retailer in Aba (natural light, direct eye contact).
- [ ] `stories-02-ibrahim` — Portrait: Ibrahim, provisions trader in Kano.
- [ ] `stories-03-tolu` — Portrait: Tolu, student in Ibadan.
- [ ] `cta-01-friends-celebrating` — Friends celebrating at a Lagos rooftop at night, bokeh.

## Hard rules
- Nigerian context only (markets, kiosks, danfos, campuses, home scenes).
- No non-Nigerian stock photos. If a shot can't be found, leave the placeholder on; **do not** substitute a generic international shot.
- No real card numbers, bank apps, IDs or receipts visible — compose Jara UI overlays in CSS instead.
- Warm highlights, plum-tinted shadows — the `.photo` grade is applied by `<Img>`.
