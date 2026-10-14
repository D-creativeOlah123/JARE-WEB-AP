# Jara

A Nigerian digital banking app. Accounts, transfers (Jara + bank),
bill payments (airtime, data, electricity, TV, education), savings goals
and Ajo groups, cards (Paystack-tokenised), and admin ops. Mobile-first
customer surface + desktop admin console.

## Stack

- **Frontend:** React 19 · Vite 8 · plain JS · CSS Modules · lucide-react icons · recharts
- **Backend:** Node 22 · Express 5 · Mongoose 9 · MongoDB Atlas
- **Auth:** JWT (15 min access in memory, 7 d refresh in an httpOnly cookie)
- **Payments:** Paystack (bank transfers + card tokenisation) + VTPass (airtime/data/bills) — both run in stub mode when no API key is set
- **Email:** Nodemailer over Gmail SMTP (port 465)

## Run locally

```bash
# 1. Backend
cd jara-backend
cp .env.example .env       # fill in MONGODB_URI + JWT secrets at a minimum
npm install
npm run seed               # seeds admin + 5 test customers (idempotent)
npm run dev                # :5000

# 2. Frontend (new terminal)
cd jara-frontend
cp .env.example .env       # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev                # :5173
```

Open http://localhost:5173.

## Seed accounts

After `npm run seed`:

| Role | Email | Password | PIN |
|---|---|---|---|
| Admin | `admin@jara.dev` | `Password123` | `1234` |
| Customer | `chinedu@jara.dev` | `Password123` | `1234` |
| Customer | `aminat@jara.dev` | `Password123` | `1234` |
| Customer | `tunde@jara.dev` | `Password123` | `1234` |
| Customer | `ngozi@jara.dev` | `Password123` | `1234` |
| Customer | `yusuf@jara.dev` | `Password123` | `1234` |

## Deploy

Full step-by-step in [`DEPLOY.md`](DEPLOY.md). Short version:

- Backend → **Render** (reads `jara-backend/render.yaml`)
- Frontend → **Vercel** (reads `jara-frontend/vercel.json`, Root Directory = `jara-frontend`)
- Set `VITE_API_URL` on Vercel to the Render URL; set `CORS_ORIGIN` on Render to the Vercel URL.

## Scripts

### Backend
```bash
npm run dev           # nodemon on :5000
npm run seed          # idempotent dev seed
npm run seed -- --reset   # wipe + reseed
```

### Frontend
```bash
npm run dev           # Vite dev server
npm run build         # production build → dist/
npm run lint          # ESLint
```

## Docs

- [`DEPLOY.md`](DEPLOY.md) — Vercel + Render step-by-step
- [`CLAIMS_TO_CONFIRM.md`](jara-frontend/CLAIMS_TO_CONFIRM.md) — regulatory, fee, delivery, and stats claims flagged `TODO(confirm)` in the UI
- [`SCOPE_NOTES.md`](jara-frontend/SCOPE_NOTES.md) — deferred scope (NIN capture, Jara-issued card, session list, attachments, channel toggles)
- [`DESIGN-BRIEF-01-LANDING.md`](DESIGN-BRIEF-01-LANDING.md) — landing page build brief
- [`DESIGN-BRIEF-02-APP.md`](DESIGN-BRIEF-02-APP.md) — in-app build brief

## Dev-only routes

Both gated behind `import.meta.env.DEV` so they're tree-shaken from production:

- `/dev/landing` — Phase 1 landing primitives showcase
- `/dev/ui` — Phase A UI primitives showcase (buttons, inputs, chips, pills, states, sheet, toasts)

## License

Proprietary. All rights reserved.
