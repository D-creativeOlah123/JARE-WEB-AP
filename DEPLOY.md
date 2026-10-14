# Deploying Jara

The frontend ships to **Vercel** and the backend ships to **Render**. Both
hosts read this repo directly, so after the first setup every `git push
main` ships a new build automatically.

---

## 0 · Rotate secrets first (one-time, mandatory)

The old `jara-backend/.env` was treated as compromised when we initialised
git, so rotate every secret before you ever expose this repo:

| Secret | Where | What to do |
|---|---|---|
| Mongo password | [Atlas → Database Access](https://cloud.mongodb.com/) | Edit the `olaideatechsis` user → **Edit password** → Autogenerate → copy the new connection string into Render later. |
| Gmail app password | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) | Revoke the existing app password; create a new one labelled "Jara (Render)". |
| JWT secrets | Local terminal | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` — run twice for `JWT_SECRET` + `JWT_REFRESH_SECRET`. |
| Paystack secret | [dashboard.paystack.com → Developers](https://dashboard.paystack.com/#/settings/developers) | Rotate the test secret if it was ever filled; leave blank for stub mode. |

Keep the new values in a password manager — they go into the Render
dashboard, never into git.

---

## 1 · Backend on Render

1. Visit [render.com/blueprints](https://dashboard.render.com/blueprints) → **New Blueprint Instance**.
2. Pick the Jara repo. Render reads [`jara-backend/render.yaml`](jara-backend/render.yaml) and offers to create the `jara-api` web service.
3. For each env var marked `sync: false`, paste the real value:
   - `MONGODB_URI` — new Atlas string
   - `JWT_SECRET`, `JWT_REFRESH_SECRET` — the two 128-char hex strings you just generated
   - `SMTP_USER`, `SMTP_PASS` — new Gmail app password
   - `CORS_ORIGIN` — leave blank for now; fill in step 2.4 once Vercel gives you a URL
   - `PAYSTACK_SECRET_KEY`, `VTPASS_API_KEY`, `VTPASS_SECRET_KEY` — paste real keys or leave blank to run in stub mode
4. Click **Create Blueprint**. The first deploy takes 3–5 min; the service URL is `https://jara-api-<id>.onrender.com`.
5. Open `https://jara-api-<id>.onrender.com/api/health` — expect `{"ok":true}`.

> **Atlas access list:** add `0.0.0.0/0` under Atlas → Network Access → +IP, or Render's static outbound IPs (listed in the Render dashboard → Settings → Outbound IPs). Without this the API boots but every Mongo call hangs.

---

## 2 · Frontend on Vercel

1. [vercel.com/new](https://vercel.com/new) → Import Git Repo → pick Jara.
2. **Root Directory** → `jara-frontend`. Vercel reads [`jara-frontend/vercel.json`](jara-frontend/vercel.json) for build + SPA rewrite settings.
3. Add one environment variable:
   - `VITE_API_URL = https://jara-api-<id>.onrender.com/api` (production and preview scopes)
4. Click **Deploy**. First build takes about 60 s.
5. Open the Vercel URL. If `/dashboard` reloads to `/`, confirm the SPA rewrite in `vercel.json` is intact.

### 2.4 · Finish the CORS round-trip

Copy the Vercel URL (e.g. `https://jara-abc123.vercel.app`) and paste it
into the Render service's `CORS_ORIGIN` env var:

```
CORS_ORIGIN=https://jara-abc123.vercel.app
```

Add a custom domain later by comma-separating it in the same var:
`https://jara-abc123.vercel.app,https://jara.app`.

Render will restart the service automatically on save.

---

## 3 · Smoke test (prod)

1. Open the Vercel URL on your phone + a desktop browser.
2. `/` renders the landing page.
3. Sign up with a real email + phone + BVN → walks through the wizard → arrives at `/dashboard`.
4. Create a transfer to a seeded test user (`chinedu@jara.dev` etc. after you run `npm run seed` from a local terminal pointed at the prod Mongo).
5. Open a receipt → **Download PDF** works.
6. Visit `/admin` as the Ada Admin seed user (promote via `npm run seed`).

---

## 4 · After every push

- Vercel builds the frontend and promotes it to Production automatically.
- Render pulls the backend, runs `npm ci`, boots `node src/server.js`.
- Changes to `render.yaml` only take effect on the next Blueprint sync — Render's Settings → Blueprint → **Sync**.

---

## 5 · Reset the Jara data in prod

```
# From a terminal with the prod MONGODB_URI exported:
cd jara-backend
npm ci
MONGODB_URI="…" npm run seed -- --reset
```

Runs the seed script against prod; wipes the Jara DB and reseeds users /
accounts / goals / groups / notifications. Idempotent per the seed audit —
re-running without `--reset` doesn't duplicate rows.
