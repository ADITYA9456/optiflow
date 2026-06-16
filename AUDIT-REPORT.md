# OptiFlow — Production-Readiness Audit Report

Full audit of the codebase (84 source files, ~10k lines) for bugs, cross-platform
safety, and deployment readiness. Status after this pass: **lint clean, build clean,
dev + production server verified booting and serving traffic.**

---

## 1. Summary of all fixes

### Security / correctness (backend)
| # | Fix | File |
|---|-----|------|
| 1 | **Privilege escalation:** `requireManager` accepted `team_leader`. Tightened to require `manager` (matches the function name, the "manager and above" comments, and the GET visibility check; no route depended on the old behavior). | `src/middleware/auth.js` |
| 2 | **`POST /api/teams` returned 500 for client errors & had no rate-limit/CSRF/JSON-guard.** Migrated to `createHandler` → proper 400/401/403/409 status mapping, rate limiting, same-origin (CSRF) check, safe JSON parsing. | `src/app/api/teams/route.js` |
| 3 | **`GET /api/teams` & `GET /api/users` mapped every error to 401** (a DB outage looked like "unauthorized"). Migrated to `createHandler` for correct status mapping + rate limiting. | `src/app/api/teams/route.js`, `src/app/api/users/route.js` |
| 4 | **Swallowed write error** on AI-suggestion persistence (`catch {}`) now logged. | `src/app/api/suggestions/route.js` |
| 5 | Duplicate import consolidated. | `src/app/api/me/route.js` |

### Runtime bugs (frontend)
| # | Fix | File |
|---|-----|------|
| 6 | **`useSearchParams()` without a Suspense boundary** (best-practice violation that forces the page out of static rendering). Wrapped the login form in `<Suspense>`. | `src/app/login/page.js` |
| 7 | **Crash:** `band.replace()` threw when the AI prediction lacked a `band` field, taking down the dashboard/profile. Added safe fallback + `promotionReadiness ?? 0`. | `src/components/HikePredictionCard.js` |
| 8 | **Invisible chart legend:** a raw `'var(--text-muted)'` string was passed to Chart.js (canvas can't resolve CSS vars). Now resolved via `readVar()`. | `src/components/charts/DashboardCharts.js` |
| 9 | **Auth flash:** dashboard rendered authed UI for one paint before redirect. Strengthened the loading gate with `!isAuthenticated`. | `src/app/dashboard/page.js` |
| 10 | Removed dead imports (`Link`, `AdminTaskTrendLine`). | `src/app/dashboard/page.js` |

### Cross-platform / config / cleanup
| # | Fix | File |
|---|-----|------|
| 11 | **Removed 3 unused dependencies** (`axios`, `@heroicons/react`, `socket.io-client`) and synced the lockfile — smaller install, faster cross-machine `npm install`. | `package.json` |
| 12 | **Added `.gitattributes`** (`* text=auto eol=lf`, `.bat`=crlf) to normalize line endings — fixes the noisy-diff / broken-script problem when zipping between macOS↔Windows↔Linux. | `.gitattributes` |
| 13 | Cleaned `optimizePackageImports` to only the package actually used (`framer-motion`). | `next.config.mjs` |
| 14 | **Scrubbed the leaked Gemini API key** from `SUMMARY.md`, `SECURITY_CHANGES_APPLIED.md`, `QUICK_REFERENCE.md`. | docs |
| 15 | **Added missing `JWT_REFRESH_SECRET`** (the code reads it; it was silently falling back to `JWT_SECRET`). Rewrote `.env.example` to match exactly what the code uses. | `.env.local`, `.env.example` |
| 16 | Added `engines.node >= 20`, cross-platform setup scripts (`setup.sh`, `setup.bat`), and `make-zip.sh` (clean portable zip). | (prior pass) |

### UI/UX & accessibility
- **Mobile tables** (`/users`, `/admin` audit log) now scroll horizontally with a `min-width` instead of clipping.
- **Accessibility:** `aria-busy` on loading buttons (spinner `aria-hidden`); `aria-expanded`/`aria-controls` on the mobile nav toggle; `aria-label`s on the people/teams search inputs.

### Cross-platform verification (already safe)
- **Import-path casing:** all 47 imports checked case-sensitively against on-disk filenames — **no mismatches**, so it won't break on case-sensitive Linux.
- **No hardcoded OS paths** anywhere in `src`.
- All `fetch` URLs are relative; all calls handle non-2xx and surface errors via toast.

---

## 2. Deployment instructions

### Option A — Vercel (recommended for Next.js)
1. Push the repo to GitHub (the working tree builds clean).
2. Import at https://vercel.com/new.
3. Add the environment variables from section 3 in **Project Settings → Environment Variables**.
4. Deploy. Vercel runs `npm install` + `npm run build` automatically.

### Option B — Any Node host (Railway / Render / Fly / VPS / Docker)
```bash
npm install
npm run build
npm run start      # serves on PORT (default 3000)
```
Requires Node 20+ and a reachable MongoDB. Set `NODE_ENV=production` so auth
cookies are marked `Secure`.

### Moving between machines (your zip workflow)
- On the source machine: `bash make-zip.sh` → produces a clean `OptiFlow.zip`
  (excludes `node_modules`/`.next`, which hold OS-specific binaries).
- On the target machine: unzip, then `setup.bat` (Windows) or `bash setup.sh`
  (Mac/Linux), then `npm run dev`. See `START-HERE.md`.

---

## 3. Required environment variables

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `MONGODB_URI` | **Yes** | MongoDB connection string. App throws on connect without it. |
| `JWT_SECRET` | **Yes** | Signs access tokens. Module throws at import if missing. |
| `JWT_REFRESH_SECRET` | Recommended | Separate secret for refresh tokens; falls back to `JWT_SECRET`. |
| `JWT_ACCESS_EXPIRES_IN` | No (def `15m`) | Access-token lifetime. |
| `JWT_REFRESH_EXPIRES_IN` | No (def `7d`) | Refresh-token lifetime. |
| `ADMIN_SECRET` | Only for privileged signup | Needed to register manager/team_leader/admin. Employee signup works without it. |
| `GEMINI_API_KEY` | No | Enables real AI suggestions/insights; without it the app uses built-in heuristics. |
| `RATE_LIMIT_AUTH_PER_MIN` | No (def `10`) | Auth rate limit per IP/min. |
| `RATE_LIMIT_API_PER_MIN` | No (def `120`) | API rate limit per IP/min. |
| `RATE_LIMIT_AI_PER_MIN` | No (def `20`) | AI rate limit per IP/min. |
| `NODE_ENV` | No | `production` enables Secure cookies. |

A complete, commented template is in `.env.example`.

---

## 4. Known limitations

1. **Realtime is polling-based, not WebSockets.** A `socket.io` server endpoint
   (`src/pages/api/socketio.js`) exists as scaffolding, but no browser client
   connects to it, so chat and notifications refresh via short-interval polling.
   On serverless (Vercel) WebSockets aren't supported anyway. To enable true
   realtime: host the socket server on a persistent Node host and add a
   `socket.io-client` connection. Until then, polling works on every platform.

2. **Rate limiting is in-memory (per instance).** Effective for single-instance
   (`next start`) deploys, but on multi-instance/serverless each instance keeps
   its own counter, weakening brute-force protection. For production at scale,
   back it with Redis/Upstash.

3. **Rotate the Gemini API key.** The old key was exposed in committed docs
   (now scrubbed from the working tree, but it still exists in git history).
   Rotate it at https://aistudio.google.com/app/apikey, and consider purging
   history with `git filter-repo`/BFG before making the repo public.

4. **MongoDB is required to run.** There's no in-memory/mock fallback — the
   target machine needs a local MongoDB or an Atlas connection string.

5. **First registered user becomes the owner.** Under a standalone (non-replica)
   MongoDB with no transactions, concurrent first-signups could race; the unique
   index rejects the loser with a 500 rather than a graceful retry. Low risk for
   normal use.
