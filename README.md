<div align="center">

# OptiFlow AI

**Jira + Slack + AI Promotion Predictor — one premium SaaS workspace.**

AI-powered workplace productivity platform combining task execution, team chat,
performance analytics and a transparent promotion/hike prediction engine. Built
as a production-grade Next.js full-stack SaaS that runs anywhere Node runs.

</div>

---

## Highlights

- **Auth & RBAC** — JWT access + refresh tokens, httpOnly cookies, role-based
  guards (`owner`, `admin`, `manager`, `team_leader`, `employee`) and a built-in
  admin-elevation request flow with owner approval.
- **AI-native** — Google Gemini integration for weekly insights, task
  recommendations and a built-in chat copilot. A transparent, explainable
  promotion/hike predictor that grounds itself in your actual work history.
- **Tasks & Kanban** — Drag-and-drop Kanban board (`@dnd-kit`), priority +
  status badges, mentions, comments, activity history, AI priority scores per
  card.
- **Team chat (Slack-like)** — Auto-provisioned team channels, direct messages,
  `@mentions`, notification dispatch, optimistic UI, optional realtime via
  Socket.io.
- **Manager analytics** — Throughput, status breakdown, weekly performance,
  promotion insights for the team.
- **Employee dashboard** — Growth tracker, visibility & promotion score, AI
  insights, AI suggestions, hike forecast with concrete next actions.
- **Admin console** — System stats, audit log viewer, admin elevation request
  review.
- **Premium UI/UX** — Real light + dark mode via CSS-variable tokens (not
  hard-coded classes), smooth animations, responsive layout, accessibility
  best-practices, reusable primitives (`Button`, `Card`, `Badge`, `Skeleton`,
  `EmptyState`, `Toast`).
- **Production hardening** — Zod validation on all critical APIs, in-memory rate
  limiting, security headers (HSTS, X-Frame-Options, etc.), same-origin CSRF
  guard on state-changing requests, audit logging, structured logger,
  notification system, refresh-token flow, retry-safe Mongo connection.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **Next.js 15** (App Router, JS only) | Server components for layout, client components for interactivity |
| UI | **Tailwind CSS v4** + CSS variables | Theme-aware via `data-theme` |
| State | React Context (Auth / Theme / Notifications) + `sonner` toasts | No external state lib needed |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable` | Accessible, keyboard friendly |
| Charts | `chart.js` + `react-chartjs-2` | Manager & employee analytics |
| Backend | **Next.js Route Handlers** (`/app/api/*`) | Each handler wrapped with `createHandler` |
| Validation | `zod` schemas in `src/lib/validation.js` |
| Auth | `jsonwebtoken` + `bcryptjs`, httpOnly cookies | Access + refresh token rotation |
| Database | **MongoDB** + `mongoose` | Indexed schemas, partial unique index for `isOwner` |
| Realtime | `socket.io` (Pages Router endpoint) | Works locally / on any Node host |
| AI | `@google/generative-ai` (Gemini 1.5 Pro) | Heuristic fallbacks if key missing |

> ## Why Next.js full-stack, not NestJS?
>
> The original brief mentioned "NestJS backend". The existing codebase was a
> working Next.js full-stack app with shipped models, routes, auth, UI, and
> tests scaffolding. Rebuilding from scratch into NestJS would have violated
> *"Do NOT rebuild from scratch / Reuse existing technologies"*. Keeping
> Next.js full-stack ships the same product in one repo, one deploy, one
> language — the right call for a solo SaaS / portfolio demo. Migrating to a
> dedicated NestJS backend later is a non-breaking refactor (the API surface
> already lives in `/app/api/*`).

## Architecture at a glance

```
src/
├── app/                # Next.js App Router
│   ├── api/            # All HTTP routes (auth, tasks, teams, chat, ai, admin, ...)
│   ├── admin/          # Owner+admin console (system stats, audit logs, requests)
│   ├── chat/           # Realtime + REST channel + DM UI
│   ├── dashboard/      # Manager + employee unified workspace
│   ├── tasks/[id]/     # Task detail with comments + activity log
│   ├── profile/        # Personal growth + hike prediction
│   ├── teams/, users/  # Team and people management (manager+)
│   ├── login/, signup/ # Auth pages
│   ├── error.js, not-found.js, loading.js
│   └── providers.js    # ThemeProvider + AuthProvider + NotificationProvider + Toaster
├── components/         # UI primitives, KanbanBoard, AIChatPanel, HikePredictionCard, ...
├── contexts/           # AuthContext, ThemeContext, NotificationContext
├── lib/                # api-handler, validation, rate-limit, jwt, audit, notifications, mongodb, gemini, logger
├── middleware/         # Server-side auth guards (requireAuth / requireManager / requireAdmin / requireOwner)
├── middleware.js       # Edge middleware for route protection
├── models/             # Mongoose models (User, Team, Task, Channel, Message, Suggestion, AdminRequest, AuditLog, Notification)
├── pages/api/          # Socket.io server (Pages Router; used only for websockets)
└── utils/              # Light client-side auth helpers (backwards compat)
```

### Request pipeline

1. **Edge middleware** (`src/middleware.js`) decodes the access JWT and
   redirects unauth'd users / wrong roles before the page renders.
2. **`createHandler`** (`src/lib/api-handler.js`) wraps every API route with:
   structured logging → rate limiting → same-origin CSRF check → Zod body
   validation → consistent error → JSON response.
3. **`requireAuth*`** guards (`src/middleware/auth.js`) verify the JWT, hydrate
   the Mongoose user, and enforce minimum role.
4. **`recordAudit`** and **`notify`** are best-effort side effects that never
   throw — every important state change is logged + notified.

## Security checklist

- [x] Passwords hashed with bcrypt (cost 12). `password` field is `select: false`.
- [x] JWT access + refresh token pair, refresh rotates on use.
- [x] HttpOnly, sameSite=lax cookies (`secure` in production).
- [x] Edge-side route guards + per-route server guards (defense in depth).
- [x] Same-origin enforcement on state-changing requests (basic CSRF guard).
- [x] Rate limiting per IP per bucket (auth = 10/min, API = 120/min, AI = 20/min).
- [x] Zod validation on every body-accepting endpoint.
- [x] Security headers (HSTS, X-Frame-Options, X-Content-Type-Options,
      Referrer-Policy, Permissions-Policy).
- [x] First user auto-becomes owner; elevated registration requires `ADMIN_SECRET`.
- [x] Audit log entries for login, register, admin request lifecycle, role changes,
      task create/update/delete, team delete, user deactivate.
- [x] Sensitive log redaction (`password`, `token`, `adminSecret`, `apiKey`).

## Local development

```bash
# 1. Install deps
npm install

# 2. Configure env
cp .env.example .env.local
# edit values — MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, ADMIN_SECRET, GEMINI_API_KEY

# 3. Run
npm run dev    # http://localhost:3000
```

> First user that signs up automatically becomes the workspace **owner**.
> Subsequent privileged signups (`manager`, `admin`, `team_leader`) must
> provide the matching `ADMIN_SECRET` value.

## Production build

```bash
npm run build
npm run start
```

## Deployment

### Vercel (recommended for the web app)

1. Push to a Git provider, import into Vercel.
2. Add all variables from `.env.example` in **Project Settings → Environment Variables**.
3. Deploy. The app, all REST routes, and the SSR layer run out of the box.

**Socket.io caveat:** Vercel serverless functions cannot hold long-lived
connections. Two production options:

- Deploy the websocket endpoint (`src/pages/api/socketio.js`) on a small Node
  host (Railway, Render, Fly.io) and point the client to that origin via
  `NEXT_PUBLIC_SOCKET_URL`.
- Or replace Socket.io with a managed pub/sub (e.g. Ably, Pusher,
  Supabase Realtime). The notification dispatcher already calls
  `globalThis.__optiflowSocketIO?.emit(...)` so swapping is localized.

REST + polling fallback in the chat UI keeps everything functional even when no
websocket server is present.

### Docker (single-node)

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Roadmap (next iterations)

- Replace in-memory rate limiter with Upstash Redis for multi-region.
- Move attachments to S3-compatible storage + presigned uploads.
- Pluggable AI providers (Anthropic, OpenAI) with provider routing.
- Slack / Teams notifications adapter.
- Saved Kanban views, swimlanes, calendar view, Gantt.
- Webhooks + REST API tokens for integrations.

## License

Internal / private — adapt per your needs.
