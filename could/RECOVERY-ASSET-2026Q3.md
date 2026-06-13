ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Retry logic, circuit breakers, backup mechanisms

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:recovery 2026-06-08 10:00 â†’ Apple JWKS 1hr cache added; atomic Lua rate limit; pm2 + Slack alerts + Redis retry unchanged

**Improvements since Q2:**
- `getCachedAppleKeys()` â€” module-level in-memory JWKS cache with 1-hour TTL; Apple auth no longer fires an external HTTP request on every sign-in
- Rate limit INCR/EXPIRE now atomic via Lua â€” expiry can no longer be permanently skipped under concurrency

**Unchanged recovery assets:**
- PM2 manages the Node.js process on Mac mini â€” auto-restarts on crash
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` log to console
- `chatAlert()` fires on Apple auth failure and recipe generation errors
- `ioredis` configured with exponential retry backoff (`min(times*200, 2000)ms`) and `enableOfflineQueue: false`
- Redis failure in rate limiter degrades gracefully (fail-open, `console.warn`)
- `GET /stats` has 60s in-memory cache with stale fallback on DB error
- OG image generation falls back to pre-generated placeholder if canvas/network fails
- CookRecord `CookStatus` lifecycle (STARTED/COMPLETED/ABANDONED) enables explicit session abandonment tracking