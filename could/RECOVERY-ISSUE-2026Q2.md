ISSUE LOG - RECOVERY
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:recovery {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:recovery 2026-06-09 18:16 → digest.ts and slack-bot.ts have no pm2 supervision; in-flight canvas OG image render is non-resumable on pm2 restart; chatAlert() not called on process-level crashes

**Auxiliary processes unsupervised:**
- `src/digest.ts` and `src/slack-bot.ts` are separate Node.js processes but only the main API (`toifood-back`) is documented in pm2 configuration. If digest or slack-bot crash (unhandled exception, OOM, network error), they are not restarted automatically — the outage is silent until manually discovered. No `chatAlert()` fires on auxiliary process failure.
- Both processes share the PostgreSQL and Redis instances with the main API. A crash loop in digest (e.g., a malformed query timing out repeatedly) could exhaust DB connections before pm2 can notice the main API process needs them.

**In-flight OG image non-resumable on restart:**
- Canvas OG image generation (`@napi-rs/canvas`) runs synchronously in the recipe save request handler. If pm2 restarts the process mid-render (e.g., after an OS update or memory pressure event), the render is killed. The recipe row may already be committed to the DB (if the save happens before the render), but `ogImage` will be null with no retry mechanism and no Slack alert. The user's recipe exists but has a broken image permanently.

**Process-level crashes not Slack-alerted:**
- `process.on('unhandledRejection')` and `process.on('uncaughtException')` in `src/index.ts` log to console only — `chatAlert()` is not called. On a Mac mini with pm2 managing the process, a crash and auto-restart cycle is invisible until someone checks pm2 logs manually. The window between crash and discovery is unbounded.

## ISSUE:recovery 2026-06-09 18:03 → No staleness recovery for STARTED cook records; expired auth tokens accumulate without cleanup; pm2 restart loses in-flight AI generation requests

**Stale STARTED records accumulate without expiry:**
- `POST /records/start` creates a CookRecord in `STARTED` state with no TTL or expiry timestamp. Records stay `STARTED` indefinitely if the app crashes, the phone loses connectivity, or the user force-quits. As of now there is no background job to mark sessions as `ABANDONED` after N hours of inactivity. Over time, stale `STARTED` records will skew metrics (e.g., cooking completion rate appears lower than reality).

**Expired token accumulation:**
- `PasswordResetToken` (1-hour expiry) and `EmailVerificationToken` (24-hour expiry) are never purged from the database. There is no `DELETE WHERE expiresAt < NOW()` scheduled job. On a high-signup system, these tables grow unboundedly.

**pm2 restart drops in-flight AI generation:**
- If pm2 restarts the process mid-recipe-generation (e.g. after a Mac mini OS update or manual restart), the AI provider call is abandoned. The user's client receives a connection reset. The recipe is not saved. There is no request retry queue or job persistence — the generation is silently lost. The user must retry manually with no indication of what happened.

**Email send failure creates partial state:**
- `sendVerificationEmail` is awaited directly in the register route. If the email service (SMTP or transactional provider) is down, the user account IS created in the DB but the request returns 500 with no email sent. The user cannot verify their email and has no way to retry without a new registration.

**Action needed:** Add `startedAt` + cleanup job for stale STARTED records after 4+ hours. Add periodic `DELETE WHERE expiresAt < NOW()` for token tables. Use a job queue for AI generation so restarts can resume. Wrap email send in try/catch returning 200 with `emailPending: false` flag.
## ISSUE:recovery 2026-06-07 16:30 → CookRecord session can be started but never completed/abandoned; OG image canvas failure crashes recipe save silently; YouTube fetch has no timeout

**Orphan CookRecord sessions:**
- `POST /records/start` creates a CookRecord with status `STARTED`. If the app crashes or user force-quits, the record stays `STARTED` forever. There is no expiry, TTL, or cleanup job — orphaned records accumulate and skew cooking statistics.

**OG image generation (`src/routes/recipes.ts`):**
- Canvas rendering (`@napi-rs/canvas`) runs synchronously in the request handler. If a font or logo file is missing, or canvas OOM occurs, the recipe may be saved but `ogImage` will be null with only a `console.warn`. No Slack alert is fired for OG image failures.
- `initPlaceholder()` is called at startup but its `Promise` is not awaited — if it fails, the placeholder is silently null and any recipe without an `ogImage` serves a broken image.

**YouTube video lookup:**
- `findRecipeVideo()` is called on every new recipe with no timeout guard. If YouTube API is slow or quota is exceeded, recipe save hangs. No fallback or circuit breaker.

**Email delivery failures:**
- `sendVerificationEmail` and `sendPasswordResetEmail` are awaited directly in routes — if the email service throws, the request fails with 500 even though the user/token was already created in DB.
## ISSUE:recovery 2026-06-07 10:00 → Apple JWKS fetched live on every request; Redis outage swallowed silently; uncaughtException not Slack-alerted

**Apple auth:** `POST /auth/apple` fetches `https://appleid.apple.com/auth/keys` on every sign-in with no caching. If Apple's JWKS endpoint is slow or down, every Apple login fails with a 401. No retry, no cache-with-TTL strategy.

**Redis failure silent:** `recipeGenerateRateLimit()` catches Redis errors and calls `next()` silently — rate limiting is fully bypassed with no alerting. This is a recovery issue because Redis going down could cause unexpected AI cost runaway without any notification.

**Process error alerting gap:** `unhandledRejection` and `uncaughtException` handlers at `src/index.ts` only log to console — they do not call `chatAlert()`. If the process crashes on the Mac mini, there's no Slack notification; discovery depends on monitoring pm2 status manually.

**OG image generation:** Canvas-based OG image generation in `src/routes/recipes.ts` fetches Twemoji assets per-recipe via HTTP. If network is unavailable, fallback to placeholder exists, but failure is logged, not alerted.

**Email token expiry:** `PasswordResetToken` expires in 1 hour, `EmailVerificationToken` in 24 hours — no cleanup job to purge expired tokens from DB; they accumulate indefinitely.

**Action needed:** Cache Apple JWKS with ~5min TTL. Add `chatAlert()` to process error handlers. Add Slack alert on Redis failure in rate limiter. Add a periodic cleanup job for expired tokens.
