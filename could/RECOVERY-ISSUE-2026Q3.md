ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:recovery 2026-06-08 10:00 → Apple JWKS cache + rate limit race fixed; orphan sessions, YouTube timeout, email 500 still open

**Fixed since Q2:**
- Apple JWKS fetched once per hour (`getCachedAppleKeys()`) — Apple auth no longer fails under concurrent sign-ins or JWKS outage spikes
- Rate limit INCR/EXPIRE is now atomic — expiry can no longer be permanently missed
- `initPlaceholder()` wrapped with `void` — startup promise no longer swallowed in a way that silently breaks OG images

**Remaining open risks:**
- `CookRecord` sessions created with status `STARTED` have no TTL or cleanup job — if the app crashes or user force-quits mid-cook, the record stays `STARTED` forever, skewing cook statistics
- `findRecipeVideo()` (YouTube) is called per recipe with no timeout guard — if YouTube API is slow or quota-exceeded, recipe save hangs with no circuit breaker
- `sendVerificationEmail` and `sendPasswordResetEmail` are awaited directly in route handlers — if the email service throws after the user/token is already written to DB, the request returns 500 with a partially committed state
- Expired `PasswordResetToken` and `EmailVerificationToken` rows are never purged — they accumulate without bound
- `unhandledRejection` / `uncaughtException` handlers still log to console only — no `chatAlert()` fires on process-level crashes; discovery depends on manual PM2 status checks