ASSET LOG - RECOVERY
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:recovery {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
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
