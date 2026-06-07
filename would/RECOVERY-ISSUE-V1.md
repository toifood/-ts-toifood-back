ISSUE LOG - RECOVERY
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:recovery {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:recovery 2026-06-07 10:00 → Apple JWKS fetched live on every request; Redis outage swallowed silently; uncaughtException not Slack-alerted

**Apple auth:** `POST /auth/apple` fetches `https://appleid.apple.com/auth/keys` on every sign-in with no caching. If Apple's JWKS endpoint is slow or down, every Apple login fails with a 401. No retry, no cache-with-TTL strategy.

**Redis failure silent:** `recipeGenerateRateLimit()` catches Redis errors and calls `next()` silently — rate limiting is fully bypassed with no alerting. This is a recovery issue because Redis going down could cause unexpected AI cost runaway without any notification.

**Process error alerting gap:** `unhandledRejection` and `uncaughtException` handlers at `src/index.ts` only log to console — they do not call `chatAlert()`. If the process crashes on the Mac mini, there's no Slack notification; discovery depends on monitoring pm2 status manually.

**OG image generation:** Canvas-based OG image generation in `src/routes/recipes.ts` fetches Twemoji assets per-recipe via HTTP. If network is unavailable, fallback to placeholder exists, but failure is logged, not alerted.

**Email token expiry:** `PasswordResetToken` expires in 1 hour, `EmailVerificationToken` in 24 hours — no cleanup job to purge expired tokens from DB; they accumulate indefinitely.

**Action needed:** Cache Apple JWKS with ~5min TTL. Add `chatAlert()` to process error handlers. Add Slack alert on Redis failure in rate limiter. Add a periodic cleanup job for expired tokens.
