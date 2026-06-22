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
## ASSET:recovery 2026-06-23 11:23 → AbortSignal timeouts per provider; Redis retry strategy; health endpoints; no circuit breakers present

- Redis: `retryStrategy: (times) => Math.min(times * 200, 2000)` — reconnects with backoff up to 2s interval; `enableOfflineQueue: false` (fail fast, don't buffer)
- Claude: `AbortSignal.timeout(30_000)` — auto-aborts at 30s; on any error triggers Ollama fallback and sets `fallback=true` in metrics
- Ollama: `AbortSignal.timeout(65_000)` — auto-aborts at 65s; on failure propagates 500 to client (no fallback)
- Ollama insights suggestions: manual `AbortController` with 8s `setTimeout`; returns fallback string on timeout
- YouTube: manual `AbortController` with 5s `setTimeout`; returns `null` on any failure
- AppStore / PlayStore: per-metric try/catch; returns `null` on failure (partial results possible)
- GitHub auth push: 2 attempts on HTTP 409 conflict; `console.warn` + return on other failures
- Health endpoints: `GET /health` and `GET /1-1-1/system/health` — return `{status:"ok",timestamp}` only; no dependency checks
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` log to console only — no restart triggered
- Stats endpoint: 60s in-memory cache; serves stale data if DB query fails and cache is warm
- No circuit breakers, no dead-letter queues, no PagerDuty/alerting hooks on persistent failure patterns

---
## ASSET:backend 2026-06-22 20:06 -> Stale-on-error cache pattern, static insight fallbacks, and unhandledRejection logging provide layered degradation

**Stale-on-error for `/stats` (`src/index.ts`)**
The stats endpoint (recipe count, user count) has a 60-second TTL in-memory cache. If the Prisma query fails and `statsCache` is populated, the cached value is returned rather than a 500. The public landing page remains functional during a brief DB outage — an appropriate trade-off for a marketing metric that can tolerate a 60-second lag.

**`ollamaSuggest` with deterministic fallback (`src/services/ai/insights.ts:3479-3500`)**
Insight generation calls Ollama with an 8-second timeout and falls back to a template string on any error. Insight records are always written with a usable `suggestion` value. The quality degrades gracefully (AI-generated → static template) rather than failing and leaving a user with no insight row.

**`unhandledRejection` and `uncaughtException` handlers (`src/index.ts`)**
Both are registered and log with `[process]` prefix. Without these, an unhandled async throw would crash the process silently. PM2 would restart it, but the crash context would be lost. The handlers give a log window before restart for PM2's `pm2 logs` to capture.

**`getAppStoreMetrics` and `getPlayStoreMetrics` return null on any error**
`src/services/appstore.ts:4028-4032`, `src/services/playstore.ts:4102-4104`: all API failures are caught and return null. The store-metrics route returns partial data (iOS available, Android null) without a full failure — the admin dashboard degrades gracefully.
## ASSET:recovery 2026-06-22 11:51 → Recovery posture snapshot June 2026

| Failure scenario | Current behaviour | Recovery path |
|---|---|---|
| Redis down | Rate limits bypassed (fail open); insight cooldown bypassed (runaway Ollama) | Manual Redis restart; no automatic fallback |
| Ollama down/hung | Claude fallback fires for users who requested Claude; Ollama users get 65s timeout then 500 | Ollama process restart via PM2 |
| Claude API error | Falls back to Ollama with `fallback=true` logged | Automatic; monitored via RECIPE-METRIC.csv |
| GitHub API down | Auth metric rows dropped silently (warn only) | No recovery; data lost |
| PostgreSQL down | All API endpoints fail with 500; no fallback | Manual DB restart |
| PM2 crash | Mac mini auto-restarts via PM2 daemon; `restart_time` counter increments | Monitored via `!status` Slack command |
| Account delete crash mid-sequence | Orphaned user record or orphaned relations | Manual DB cleanup required; no automated repair |
| YouTube quota exhausted | `findRecipeVideo` returns null; recipe saved without videoId | Graceful null; no alert fired |
## ASSET:backend 2026-06-22 11:03 → Auth metrics offsite, all primary data in PostgreSQL, Redis fully ephemeral

**PostgreSQL is the single source of truth** — All durable data (users, recipes, pantry, lists, cook records, insights, flows) is in PostgreSQL. A full pg_dump covers everything needed to restore user data and recipe history.

**Auth metrics are offsite** — `routes/auth.ts` pushes each auth metric row to `toifood-dev/ts-toifood-dev/would/AUTH-METRIC.csv` via GitHub API (with 2-attempt retry on 409 conflict). The remote copy lags by at most one failed commit but covers login/register events for audit purposes.

**Redis is fully ephemeral** — Rate limit keys (1h TTL) and insight cooldown keys (7d TTL). No durable data in Redis. Restart-safe.

**OG image fallback** — `placeholderOgImage` is generated at server startup in memory. If the DB `ogImage` field is null (old recipes), the placeholder is served. No external image storage dependency.

**Restore sequence:**
1. Restore PostgreSQL from backup (`pg_restore` or `psql < dump.sql`)
2. Run `npx prisma generate` (schema already matches if dump is current)
3. Do NOT run `npx prisma migrate deploy` on a restored DB that already has all migrations applied — this would attempt to re-apply and fail
4. Start Redis fresh (`redis-server` with empty/no RDB)
5. Start Node.js (`pm2 start dist/src/index.js --name toifood-back`)
6. Verify Cloudflare Tunnel is running
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
