ASSET LOG - RECOVERY
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:recovery {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Retry logic, circuit breakers, backup mechanisms

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:recovery 2026-06-13 18:11 → Timeout guards, Redis fail-open, and graceful process error handlers in place

All AI provider calls use `AbortSignal.timeout` (65s Ollama, 30s Claude) to prevent indefinite hangs. Redis clients are configured with `enableOfflineQueue: false` and exponential `retryStrategy` (max 2s) — rate limiting fails open with a `console.warn` rather than blocking user requests. The stats endpoint caches results in memory and serves stale data on DB error. `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers in `index.ts` log errors and prevent silent process death. Apple JWKS keys are cached in-memory for 1 hour to reduce external dependency calls and survive transient Apple API hiccups.
## ASSET:recovery 2026-06-13 17:04 → Existing fallback surfaces and fail-open patterns

**Claude→Ollama fallback** (`src/routes/recipes.ts:231-248`):
```ts
try { result = await claude.generateRecipe(request); usedProvider = 'claude'; }
catch { /* falls back */ result = await ollama.generateRecipe(request); fallback = true; }
```
Fallback is logged and recorded in RECIPE-METRIC.csv `fallback` column.

**Rate-limit Redis fail-open** (`src/middleware/rateLimit.ts:100-102`):
If Redis throws, rate limiting is skipped with a console.warn — the request proceeds.

**Insight Redis client** (`src/services/ai/insights.ts:810-813`):
```ts
new Redis(REDIS_URL, { enableOfflineQueue: false, retryStrategy: (t) => Math.min(t*200, 2000) })
```

**Ollama timeout:** 65s `AbortSignal.timeout(65_000)` (`src/services/ai/ollama.ts:228`)

**Digest Ollama timeout:** 15s `AbortController` + `setTimeout` (`src/digest.ts:109`)

**chatAlert on generation failure:** `src/routes/recipes.ts:339` fires `chatAlert(..., 'error')` to Google Chat on any unhandled recipe generation error

**PM2 process-level recovery:** `pm2 start dist/src/index.js --name toifood-back` with default restart policy
## ASSET:recovery 2026-06-09 18:16 â†’ Fail-open strategy is consistent across all three infrastructure dependencies (Redis, DB stats, canvas); auth token generation uses cryptographically secure random bytes; pm2 preserves stack traces for post-mortem

**Consistent fail-open design across dependencies:**
- Redis failure â†’ rate limiter calls `next()` with `console.warn` â€” API stays available; UX unaffected
- DB failure on `GET /stats` â†’ 60s in-memory stale cache is served â€” public stats never return 500
- Canvas failure on OG image â†’ pre-generated placeholder buffer served â€” recipe save succeeds; image degrades gracefully
- This consistent pattern means the Mac mini M4 can tolerate any single infrastructure failure without a complete API outage.

**Cryptographically secure token generation:**
- `PasswordResetToken` and `EmailVerificationToken` both use `crypto.randomBytes(32)` â€” no predictable token sequence even if generation timestamps are known. Token entropy is 256 bits, making brute-force infeasible even with DB access.

**pm2 log preservation for post-mortem:**
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` log the full error and stack before pm2 triggers restart. pm2 persists these logs to disk â€” stack traces from a crash are available for post-mortem even after the process has restarted and resumed serving requests.

## ASSET:recovery 2026-06-09 18:03 â†’ Three-state CookRecord lifecycle enables client-side session resume; Redis fail-open with warning preserves UX under infrastructure outage; OG image placeholder fallback in place

**CookRecord as client recovery checkpoint:**
- `GET /records` returns all in-progress (`STARTED`) sessions â€” mobile clients can detect an interrupted cook on next app launch and offer to resume or abandon. The three-state lifecycle (STARTED/COMPLETED/ABANDONED) is the data contract that enables this recovery UX without additional server logic.
- Ownership check `{ id, userId: req.userId }` on PATCH routes prevents cross-user session manipulation during recovery flows.

**Infrastructure fail-open strategy:**
- Redis failure: rate limiter calls `next()` with a console warning â€” API remains available under Redis outage. Users experience no degradation; cost risk is the tradeoff.
- OG image failure: falls back to pre-generated placeholder buffer (`initPlaceholder()`) â€” recipe saves succeed even when canvas fails. Recipes are never blocked by image generation failures.
- Stats DB failure: `GET /stats` returns last-known cached values (60s in-memory TTL) â€” public-facing stat display never returns 500.

**Process-level recovery:**
- `pm2` auto-restarts the Node.js process on crash â€” Mac mini recovers from OOM or unhandled exception without manual intervention
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` both capture and log the error before pm2 triggers restart â€” stack traces preserved in pm2 logs for post-mortem

**Auth resilience:**
- Password reset and email verification tokens use `crypto.randomBytes(32)` â€” no predictable token sequences; secure even if an attacker observes timing of token creation
## ASSET:recovery 2026-06-07 16:30 â†’ CookRecord status lifecycle (STARTED/COMPLETED/ABANDONED) enables partial session tracking; Redis retry strategy in place

**CookRecord lifecycle:**
- Three-state status enum `CookStatus` (STARTED/COMPLETED/ABANDONED) allows the app to model cooking sessions with explicit abandonment â€” better than a binary done/not-done
- `PATCH /records/:id/complete` and `PATCH /records/:id/abandon` both require userId ownership check before mutation
- Records are immutable after status change â€” no double-complete/double-abandon possible via API

**Redis resilience:**
- `ioredis` configured with `retryStrategy: (times) => Math.min(times * 200, 2000)` â€” exponential backoff up to 2s between retries
- `enableOfflineQueue: false` prevents request queuing during Redis outages
- Rate limit middleware catches Redis errors and logs a warning rather than failing the request â€” degrades gracefully

**General error recovery (carried forward from prior analysis):**
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` handlers log errors to console
- `chatAlert()` (Slack) is called on Apple auth failures
- `/stats` endpoint falls back to cached data on DB error
- Logo buffer (`assets/logo-small.png`) load failure is caught and swallowed at startup â€” server continues without logo
## ASSET:recovery 2026-06-07 10:00 â†’ Recovery mechanisms: pm2 restart, Slack alerts, Redis retry, stats cache fallback, process error handlers

**Process recovery:**
- `pm2` manages the Node.js process on Mac mini â€” auto-restarts on crash
- `process.on("unhandledRejection")` and `process.on("uncaughtException")` log errors to console (`src/index.ts`)

**Alerting:**
- `chatAlert()` (`src/lib/chat.ts`) sends Slack messages â€” used in Apple auth failure and recipe generation errors
- Auth limiter (express-rate-limit) on all auth routes: 10 requests per 15 min per IP

**Redis resilience:**
- `ioredis` with `enableOfflineQueue: false` and `retryStrategy: min(times*200, 2000)` â€” backoff up to 2s
- On Redis failure: rate limiting silently skipped (fail-open), `getRecipeUsage()` returns zeroed defaults

**Data resilience:**
- `GET /stats` has a 60s in-memory cache with stale fallback â€” if DB query fails, last known stats are served
- OG image generation falls back to pre-generated placeholder if canvas/network fails
- Password reset tokens and email verification tokens use `crypto.randomBytes(32)` â€” no collision risk

**Slack bot** (`src/slack-bot.ts`) and **digest** (`src/digest.ts`) exist as separate processes for operational visibility
