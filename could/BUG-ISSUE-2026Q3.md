ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:bug 2026-06-08 10:00 → 5 Q2 bugs fixed; 4 production risks remain: orphan sessions, YouTube hang, email 500, no tests

**Resolved since Q2 (branch 1-1-1, commit 0c111be):**
- Apple JWKS fetched on every call → `getCachedAppleKeys()` 1hr in-memory cache
- HTML injection in password reset → `escHtml()` applied to `token` + `msg` before HTML interpolation
- Rate limit INCR/EXPIRE race → atomic Lua script
- Unawaited `initPlaceholder()` → wrapped with `void`
- `stemMatch` false positives → `pluralStem()` rewritten with irregular map + `-ee` guard

**Remaining risks:**
- `CookRecord` sessions with status `STARTED` have no expiry or cleanup — orphaned forever on app crash or force-quit; `STARTED` records skew cooking statistics
- `findRecipeVideo()` (YouTube) called per recipe with no timeout — hangs the recipe save if YouTube API is slow or quota-exceeded; no circuit breaker
- `sendVerificationEmail` / `sendPasswordResetEmail` awaited in route handlers after DB write — if mail service throws, route returns 500 with a user/token already committed
- Zero test coverage — no unit, integration, or e2e tests; any refactor, migration, or new route is entirely unverified; regressions are invisible until reported by users