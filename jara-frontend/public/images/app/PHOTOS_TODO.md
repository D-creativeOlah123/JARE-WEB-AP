# App photos — still-to-source list

All slots in `src/data/appImages.js` currently render the duotone
placeholder via `<Img>`. Drop a file at 3 widths into
`public/images/app/<base>-640.webp`/`-1280.webp`/`-1920.webp` and flip
`available: true` on its entry — no code change beyond that.

### Required slots

- [ ] `auth-01-welcome` · Young professional at a Lagos café, phone in hand, morning light.
- [ ] `auth-02-open-account` · Person at a desk filling details on phone, ID card face-down.
- [ ] `auth-03-reset` · Calm portrait, phone, neutral background. Decorative.
- [ ] `empty-01-first-transaction` · Hand holding a phone with blank screen, market blur.
- [ ] `empty-02-first-goal` · Jar of folded naira notes on a table.
- [ ] `empty-03-first-group` · Friends' hands stacked together.
- [ ] `empty-04-no-cards` · Empty cardholder/wallet on a desk.
- [ ] `empty-05-no-notifications` · Quiet phone face-down on a notebook.
- [ ] `empty-06-no-tickets` · Headset on a desk.
- [ ] `transfer-hub-01-jara` · Two friends bumping fists, phones in other hands.
- [ ] `transfer-hub-02-bank` · Hand holding a debit card over a laptop.
- [ ] `services-01-header` · Wide shot of a Lagos street with shops, wires, signage.
- [ ] `goal-cat-rent` · Door key, duotone thumb.
- [ ] `goal-cat-school` · Graduation cap, duotone thumb.
- [ ] `goal-cat-business` · Shop shelf, duotone thumb.
- [ ] `goal-cat-travel` · Airplane window, duotone thumb.
- [ ] `goal-cat-emergency` · First-aid kit, duotone thumb.
- [ ] `goal-cat-gadgets` · Laptop, duotone thumb.
- [ ] `savings-03-goal-reached` · Person raising arms with phone, joy.
- [ ] `support-01-agent` · Nigerian support agent with headset at a tidy desk. Model release.
- [ ] `admin-01-ops-team` · Ops team at monitors, soft focus.
- [ ] `admin-empty-01` · Empty desk with monitor.

### Rules
- Nigerian context only.
- No non-Nigerian stock. Keep the placeholder on if the shoot isn't ready.
- No real card numbers, bank apps, IDs or receipts visible — composite Jara UI overlays in CSS instead.
