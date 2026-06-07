ASSET LOG - RECOVERY
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:recovery {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:recovery 2026-06-07 16:30 → CookRecord status lifecycle (STARTED/COMPLETED/ABANDONED) enables partial session tracking; Redis retry strategy in place

**CookRecord lifecycle:**
- Three-state status enum `CookStatus` (STARTED/COMPLETED/ABANDONED) allows the app to model cooking sessions with explicit abandonment — better than a binary done/not-done
- `PATCH /records/:id/complete` and `PATCH /records/:id/abandon` both require userId ownership check before mutation
- Records are immutable after status change — no double-complete/double-abandon possible via API

**Redis resilience:**
- `ioredis` configured with `retryStrategy: (times) => Math.min(times * 200, 2000)` — exponential backoff up to 2s between retries
- `enableOfflineQueue: false` prevents request queuing during Redis outages
- Rate limit middleware catches Redis errors and logs a warning rather than failing the request — degrades gracefully

**General error recovery (carried forward from prior analysis):**
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers log errors to console
- `chatAlert()` (Slack) is called on Apple auth failures
- `/stats` endpoint falls back to cached data on DB error
- Logo buffer (`assets/logo-small.png`) load failure is caught and swallowed at startup — server continues without logo
## ASSET:recovery 2026-06-07 10:00 → Recovery mechanisms: pm2 restart, Slack alerts, Redis retry, stats cache fallback, process error handlers

**Process recovery:**
- `pm2` manages the Node.js process on Mac mini — auto-restarts on crash
- `process.on("unhandledRejection")` and `process.on("uncaughtException")` log errors to console (`src/index.ts`)

**Alerting:**
- `chatAlert()` (`src/lib/chat.ts`) sends Slack messages — used in Apple auth failure and recipe generation errors
- Auth limiter (express-rate-limit) on all auth routes: 10 requests per 15 min per IP

**Redis resilience:**
- `ioredis` with `enableOfflineQueue: false` and `retryStrategy: min(times*200, 2000)` — backoff up to 2s
- On Redis failure: rate limiting silently skipped (fail-open), `getRecipeUsage()` returns zeroed defaults

**Data resilience:**
- `GET /stats` has a 60s in-memory cache with stale fallback — if DB query fails, last known stats are served
- OG image generation falls back to pre-generated placeholder if canvas/network fails
- Password reset tokens and email verification tokens use `crypto.randomBytes(32)` — no collision risk

**Slack bot** (`src/slack-bot.ts`) and **digest** (`src/digest.ts`) exist as separate processes for operational visibility
