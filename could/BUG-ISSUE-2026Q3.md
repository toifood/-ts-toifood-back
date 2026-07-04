ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Unhandled rejections, null dereferences, async race conditions, edge cases that could fail silently in prod

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:bug 2026-07-05 07:03 → Unauthenticated ops webhook + email-casing bug in ts-toifood-back

**Finding — `src/routes/chat.ts` (mounted unauthenticated at `/chat` and `/1-1-6/api/chat` in `src/index.ts:46,62`)**
The Google Chat webhook handler runs `pm2 jlist` and `pm2 logs toifood-back --lines N` via `child_process.exec` and returns process names, RAM/CPU, uptime, restart counts, and raw recent log lines to whoever POSTs `{"message":{"text":"!status"}}` / `"!logs"` / `"!metrics"`. Unlike `src/routes/storeMetrics.ts:15-16`, which gates equivalent operational data behind `requireAuth, requireAdmin`, this route has no auth, no shared-secret/signature check, and no verification that the request actually originated from Google Chat. Anyone who discovers the endpoint gets a live ops dashboard and log tail (which may contain user emails/IDs from other console logging in the codebase) with a single unauthenticated POST.

**Finding — `src/routes/users.ts:195-211` (`PATCH /users/me`)**
Email is compared and persisted without lowercasing: `if (email && email !== user.email)` and `...(email ? { email } : {})`. Every other identity path normalizes to lowercase — registration (`src/routes/auth.ts:217`), local-strategy login (`src/routes/auth.ts:136`), Google/Apple upserts (`auth.ts:170,292`). If a user updates their profile email with different casing (e.g. `Jane@Example.com`), it's stored as-is. Their next password-login attempt lowercases the input before the `prisma.user.findUnique({ where: { email } })` lookup (`auth.ts:136-137`), which won't match the mixed-case stored value — the user is locked out of password login until support intervenes. It also allows two accounts to exist for the same real address differing only by case, since Postgres `@unique` is case-sensitive.

**Finding — `src/routes/users.ts:301` (`DELETE /users/me`, stale comment)**
Comment states "User cascades → SavedList, PantryItem, UserFlowView", but `UserFlowView` no longer exists in `prisma/schema.prisma` — migration `20260703000000_remove_flows_model` dropped the flow system entirely (consistent with `src/routes/insights.ts` and the absence of any Flow model in the current schema). The comment is dead documentation that will mislead anyone reasoning about cascade behavior during account deletion.
## ISSUE:bug 2026-07-04 07:06 → Uncaught async route errors hang requests; Ollama mutex ineffective; unauthenticated /chat leaks logs; email-change lockout

**Systemic: async handlers without try/catch — Express 4 swallows the rejection**
`cookRecords.ts` (all 6 handlers), `lists.ts` (all 6), `pantry.ts` (GET/DELETE), `insights.ts`, `admin.ts` `requireAdmin`, and several `auth.ts`/`recipes.ts` handlers (`register`, `verify-email`, `reset-password`, `/:id`, `/:id/share`, `/:id/review`, note PATCHes) run Prisma calls with no try/catch. Express 4 does not forward async rejections, so any DB error becomes an unhandledRejection (only logged by the process hook in `index.ts`) and the client request hangs until timeout — a silent prod failure mode.

**Ollama serialization queue never serializes — `src/services/ai/ollama.ts` + `src/routes/recipes.ts`**
`OllamaProvider.queue` is an instance field, but the generate route does `new OllamaProvider()` per request. Concurrent generations hit the 7b model simultaneously, exactly the contention the queue was written to prevent; symptom is random 65s timeouts under parallel load.

**Unauthenticated ops endpoint — `src/routes/chat.ts`**
`POST /chat` (and `/1-1-6/api/chat`) has no auth and no Google Chat request verification. Anyone can POST `{"message":{"text":"!logs"}}` and receive PM2 logs — which include userIds and request paths — or `!status` for process intel.

**Email change lockout — `src/routes/users.ts` PATCH /me**
`email` is stored as-sent with no format validation and no `.toLowerCase()`, while register/login normalize to lowercase. A user who changes email to `Jane@Example.com` can never log in again (lookup misses) and password reset also misses — silent account lockout.

**`resend-verification` can hang — `src/routes/auth.ts` + `src/services/email.ts`**
`createTransport()` throws synchronously when `GMAIL_USER`/`GMAIL_APP_PASSWORD` are unset, and `sendVerificationEmail` is awaited with no try/catch → unhandled rejection, hung request. (`forgot-password` wraps its send correctly — this one doesn't.)

**Carry-overs still open from Q2**
- `CookRecord` rows stuck in `STARTED` have no expiry/cleanup — force-quit apps orphan them forever and skew stats.
- `pushRowToGitHub` (`auth.ts`) is a read-modify-write on the GitHub contents API with one 409 retry — concurrent auth events can still drop rows, and the CSV is re-downloaded in full on every append (unbounded growth).
## ISSUE:bug 2026-06-08 10:00 â†’ 5 Q2 bugs fixed; 4 production risks remain: orphan sessions, YouTube hang, email 500, no tests

**Resolved since Q2 (branch 1-1-1, commit 0c111be):**
- Apple JWKS fetched on every call â†’ `getCachedAppleKeys()` 1hr in-memory cache
- HTML injection in password reset â†’ `escHtml()` applied to `token` + `msg` before HTML interpolation
- Rate limit INCR/EXPIRE race â†’ atomic Lua script
- Unawaited `initPlaceholder()` â†’ wrapped with `void`
- `stemMatch` false positives â†’ `pluralStem()` rewritten with irregular map + `-ee` guard

**Remaining risks:**
- `CookRecord` sessions with status `STARTED` have no expiry or cleanup â€” orphaned forever on app crash or force-quit; `STARTED` records skew cooking statistics
- `findRecipeVideo()` (YouTube) called per recipe with no timeout â€” hangs the recipe save if YouTube API is slow or quota-exceeded; no circuit breaker
- `sendVerificationEmail` / `sendPasswordResetEmail` awaited in route handlers after DB write â€” if mail service throws, route returns 500 with a user/token already committed
- Zero test coverage â€” no unit, integration, or e2e tests; any refactor, migration, or new route is entirely unverified; regressions are invisible until reported by users