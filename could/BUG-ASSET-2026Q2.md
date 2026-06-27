ASSET LOG - BUG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:bug {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Error handling coverage, validation boundaries, logging on failure paths

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:ts-toifood-back 2026-06-28 06:25 → atomic Lua rate-limit increment prevents TOCTOU race and duplicate recipe detection guards against double-save

**Finding — `src/middleware/rateLimit.ts`**
The Redis increment uses a Lua script that atomically sets the key expiry only on the first call (`if c == 1 then EXPIRE`). This prevents the classic race where two concurrent requests both see count===1 and the key never receives an expiry — most naive implementations get this wrong with a separate SET EX call.

**Finding — `src/routes/recipes.ts` (POST /recipes)**
Before saving, the server queries for a recipe with the same title created in the last 24 hours by the same user. A duplicate is logged as a warning rather than blocked — a conservative choice that preserves user intent while surfacing repeated saves in logs for later analysis.
## ASSET:bug 2026-06-27 10:49 → Four additional logic gaps: email reverification skip, admin role leak, insight cooldown before analysis, hardcoded log path

**Email change without reverification (`src/routes/users.ts:PATCH /users/me`)** — Add `emailVerified: false` to the `prisma.user.update` data block whenever `email` changes, then delete any existing `EmailVerificationToken` rows for the user and call `sendVerificationEmail` with a fresh token — mirroring the pattern in `POST /auth/resend-verification`.

**Admin role leak (`src/routes/recipes.ts:GET /public/:token`)** — Remove `role` from the public `author` object. The `isPremium` boolean (`role !== "free"`) exposes the same business information without revealing admin designation. The `GET /users/:id/profile` public endpoint exposes `role` in `author.role` for the same reason and needs the same fix.

**Insight cooldown set prematurely (`src/services/ai/insights.ts:runInsightAnalysis`)** — Move `redis.set(cooldownKey, ...)` to after analyzers complete and at least one candidate is produced. Alternatively apply a short TTL (e.g., 1 h) on failure so a transient Ollama outage does not block insight generation for the full 7-day window.

**Hardcoded infra log path (`src/digest.ts`)** — Replace the literal path with `process.env.INFRA_HEALTH_LOG_PATH ?? "/Users/jayagent/.openclaw/logs/infra_health.log"` and add `INFRA_HEALTH_LOG_PATH=` to `.env.example`. Log a startup warning if the resolved path does not exist so omission is visible rather than silent.
## ASSET:bug 2026-06-26 19:17 → Three confirmed logic gaps: missing email send, mismatched pantry stem matching, Redis-down usage counter

**Register verification gap (`src/routes/auth.ts:226-234`)** — User is created and token returned but `sendVerificationEmail` is never called. Fix: create an `EmailVerificationToken` and call `sendVerificationEmail` immediately after `prisma.user.create`, mirroring the pattern in `POST /auth/resend-verification` (lines 487-499).

**Discover stem-match gap (`src/routes/recipes.ts:1231-1236`)** — The raw SQL uses `LOWER(pu) IN (SELECT LOWER(ingredient) ...)`. To match the `pluralStem()` behaviour used elsewhere, the lateral subquery should apply PostgreSQL's `regexp_replace` to normalise plurals, or alternatively the `pantryUsed` array stored on recipes should already be stemmed at save time so exact matching suffices.

**`getRecipeUsage` Redis-down fallback (`src/middleware/rateLimit.ts:30-46`)** — The catch block should return the actual limit values with `used` set to a sentinel (e.g. `-1`) or re-throw so the caller can surface an error state, rather than silently returning zeros that the frontend interprets as "full quota remaining".
## ASSET:bug 2026-06-26 13:51 → Apple JWKS cached with 1hr TTL; insights uses Promise.allSettled with per-analyzer fallbacks; password-reset HTML escapes user input; auth metric GitHub retry re-fetches SHA on 409; cookRecords pluralStem guards invariant plurals

**Apple JWKS response is cached to avoid per-request key fetches** (`src/routes/auth.ts` ~line 127)
`getCachedAppleKeys()` stores the key array with a 1-hour TTL. Sign-ins hit `https://appleid.apple.com/auth/keys` at most once per hour; a slow or temporarily unavailable Apple endpoint does not degrade every auth request. Cache invalidation is time-based, which matches Apple's infrequent key-rotation schedule.

**`runInsightAnalysis` uses `Promise.allSettled` — analyzer failures are isolated** (`src/services/ai/insights.ts` ~line 204)
Each of the five analyzers runs concurrently under `Promise.allSettled`. A rejected promise from one category (e.g., Ollama timeout in `analyzeMealType`) does not cancel the others. `ollamaSuggest` also has an 8-second `AbortController` timeout and returns a hardcoded fallback string on any error, so every analyzer that reaches the LLM call is guaranteed to return a value.

**Password-reset HTML form sanitises token before rendering** (`src/routes/auth.ts` ~line 380)
`escHtml` escapes `&`, `<`, `>`, and `"` before embedding the user-supplied reset token into the HTML form's hidden input and error messages. Reflected-XSS via a crafted token value in the GET/POST reset form is blocked.

**`pushRowToGitHub` retries on 409 with a fresh SHA** (`src/routes/auth.ts` ~line 35)
The fire-and-forget GitHub metric writer loops up to 2 attempts. On a 409 Conflict (concurrent commit), it re-fetches the current file SHA and retries the PUT, handling the common race where two auth events land within the same second. Errors are caught and warn-logged rather than propagated.

**`cookRecords.ts` `pluralStem` protects invariant and irregular forms** (`src/routes/cookRecords.ts` ~line 7)
The stemmer guards the `/ee$/` class ("cheese"→"cheese", "coffee"→"coffee") before applying strip rules, preventing the aggressive over-stripping present in the recipes.ts inline implementation. Twelve irregular plurals (feet, teeth, geese, mice, etc.) are handled explicitly rather than by rule, making cook-record pantry classification correct for common cooking ingredients.
## ASSET:bug 2026-06-24 19:18 → Strong input validation at all boundaries; Lua atomic rate-limit counter; chatAlert on generation failures; try-catch on all metric file writes

**Validation boundaries are well-enforced across all routes**
- Auth: email ≤ 100 chars, name ≤ 50 chars, password 8–128 chars, checked before any DB call
- Recipes: ingredients array validated (type, empty-string filtered, capped at 50 items, each sliced to 50 chars); `servings` falls back to 2 if not a positive number
- Pantry: cap of 50 items enforced with an explicit count query before insert; P2002 duplicate key is caught and re-queried for the safe conflict response
- Lists: `MAX_LISTS = 5` enforced with count query; name trimmed and non-empty validated
- Users: dietary filters validated against `DietaryFilter` enum; max 3 filters enforced; `continentPreferences` filtered against the `VALID_CONTINENTS` allowlist; `ageRange` and `gender` validated against enum tuples before any DB write

**Rate-limit counter uses a Lua atomic script** (`src/middleware/rateLimit.ts` ~line 514)
The INCR + EXPIRE sequence is wrapped in a single `redis.eval` Lua call, eliminating the TOCTOU race where two concurrent requests both see count === 1 and the key never gets an expiry. This is the correct pattern.

**Recipe generation failures are monitored** (`src/routes/recipes.ts` ~line 2170)
`catch` block fires `chatAlert("🍽️ Recipe Generation Failed", ..., "error")` — failures are visible in Google Chat without polling logs.

**All metric CSV writes are try-caught** (`src/routes/recipes.ts`, `src/routes/auth.ts`)
`appendMetric`, `appendDiscoverMetric`, and `appendAuthMetric` each wrap the file operations in try-catch with `console.warn`, so a disk-full or permission error never propagates to the request handler.

**Redis connection errors are isolated** (`src/middleware/rateLimit.ts` line 452, `src/services/ai/insights.ts` line 179)
Both Redis clients have `enableOfflineQueue: false` and `retryStrategy` configured; `redis.on("error")` is registered to prevent unhandled rejection crashes.

**`DELETE /users/me` manually orders deletions by FK dependency** (`src/routes/users.ts` ~line 3104)
Models without `onDelete: Cascade` (DietaryPreference, PasswordResetToken, EmailVerificationToken) are deleted explicitly before the user row, avoiding FK violation. The deletion order is correct given the schema constraints.

**Gaps noted**
- `DELETE /users/me` runs 5 sequential Prisma operations with no transaction — a mid-sequence failure leaves the account in a partially deleted state with no rollback
- No `chatAlert` on `prisma.user.create` failure in `register` or on `sendPasswordResetEmail` throw — auth path failures are silent to ops
- `GET /users/:id/profile` has no `requireAuth` middleware — unauthenticated callers can probe any user ID for public profile data (likely intentional for public profiles, but worth confirming)
## ASSET:bug 2026-06-24 10:24 → P2002 catch on pantry duplicate is robust; list and flow ownership re-checks are tight; email service propagates rejections correctly; four new silent failure modes confirmed

**Robust paths confirmed in newly read code:**
- `POST /pantry` P2002 catch block (`src/routes/pantry.ts`): a duplicate insert that races past the TOCTOU window is caught by `err.code === "P2002"`, which re-fetches the conflicting row and returns a consistent 409 with the existing item. No write error leaks to the client as a 500.
- `DELETE /pantry/:id` ownership re-check: `findFirst({ id, userId })` before `deleteMany` prevents cross-user deletion and returns 404 cleanly — no IDOR surface on delete.
- `POST /lists/:id/recipes/:recipeId` double ownership: both list (`userId: req.userId!`) and recipe (`userId: req.userId!`) are verified before the `SavedListItem.upsert` — a user cannot add another user's recipe to their list.
- `POST /flows/:id/response` upsert idempotency: `UserFlowView.upsert` on `{ userId_flowId }` unique constraint is safe on network retry — no duplicate view rows accumulate.
- `sendVerificationEmail` and `sendPasswordResetEmail` (`src/services/email.ts`): both are fully `async` and propagate rejections to their callers without swallowing them — the error-handling gap is in the callers, not the service.

**New silent failure modes confirmed in this pass:**
- `OllamaProvider._generate` continent preference drop (`src/services/ai/ollama.ts`): `pickRegion()` called without `request.continentPreferences` — mismatch with ClaudeProvider is silent; no log entry when user preferences are in effect, no fallback indicator in the response.
- `getAIProvider()` per-request instantiation (`src/services/ai/index.ts`): each request receives a new `OllamaProvider` with a reset queue, silently re-introducing concurrent Ollama calls. No warning is emitted; the queue chaining runs correctly but on a queue that is always empty.
- `POST /auth/resend-verification` missing try/catch (`src/routes/auth.ts`): Gmail transport failure surfaces as an unhandled async rejection — no structured log distinguishes email failure from token-creation failure; the 500 gives the client no actionable error code.
- `POST /flows/:id/response` on inactive flow: dietary preference overwrite (`deleteMany + createMany`) proceeds with no `isActive` guard and no log entry — no audit trail distinguishes a legitimate response from a stale-client replay against a deactivated flow.
## ASSET:bug 2026-06-24 09:27 → Promise.allSettled isolates analyzer failures; ollamaSuggest timeout is safe; pluralStem and stemMatch degrade gracefully; three new silent failure modes confirmed

**Robust paths confirmed in newly reviewed code:**
- `runInsightAnalysis` wraps all five analyzers in `Promise.allSettled` — a single failing analyzer (dietary, cuisine, style, pantry, mealType) does not block the others. Settled errors are discarded per-analyzer; partial results are written to the DB without propagating the rejection.
- `ollamaSuggest` (`src/services/ai/insights.ts`) wraps the Ollama call in a `try/catch` with an 8-second `AbortController` timeout. On any error (timeout, parse failure, network drop), it returns the pre-computed `fallback` string — insight text generation failure is always non-fatal.
- `pluralStem` IRREGULAR table explicitly handles `leaves`, `knives`, `feet`, `teeth`, `children`, and 10 other common English irregulars — naive `s`-stripping is skipped for these. The `ee$` invariant guard prevents `"cheese"` → `"chees"` corruption. The `oes$` rule correctly strips `tomatoes` → `tomato`.
- `stemMatch` bidirectional include-check (`as.includes(bs) || bs.includes(as)`) ensures pantry matching at cook-start degrades gracefully for partial names — `"flour"` matches `"bread flour"` in either direction without requiring exact stems.
- `GET /records` caps at `take: 100` (`src/routes/cookRecords.ts`) — no unbounded pagination exposure.

**New silent failure modes confirmed in this pass:**
- `analyzePantry` (`src/services/ai/insights.ts`): full quantity-prefixed ingredient strings (`"2 cups flour"`) are compared against bare pantry names via `Set.has` — exact match always fails, so every ingredient is flagged as missing regardless of pantry state. No log, no validation of ingredient string format before comparison.
- `POST /records/start` has no STARTED-state check before `prisma.cookRecord.create` — duplicate STARTED rows accumulate silently; the only observable signal is inflated counts in cook history.
- `PATCH /records/:id/complete` and `/abandon` have no `existing.status !== 'STARTED'` guard — terminal-state transitions (ABANDONED → COMPLETED, COMPLETED → ABANDONED) succeed silently with no log distinguishing a valid transition from an illegal re-drive.
## ASSET:bug 2026-06-24 09:03 → CookRecord and insights endpoints have tight ownership and state guards; three new input-boundary gaps identified

**Robust paths confirmed:**
- `POST /records/start`: ownership verified via `prisma.recipe.findFirst({ id: recipeId, userId: req.userId! })` before any write — cross-user injection impossible. All ingredient categorization (`pantryItems`, `groceryItems`) is computed server-side from the user's live pantry; no client-supplied pantry/grocery arrays are trusted.
- `PATCH /records/:id/complete` and `PATCH /records/:id/abandon`: both fetch the record with `{ id, userId: req.userId! }` before update — no IDOR path on status transitions.
- `PATCH /insights/:id`: three-layer guard — status must be strictly `"accepted"` or `"dismissed"` (400 otherwise), ownership check (`insight.userId !== req.userId!` → 404), state guard (`insight.status !== "pending"` → 400 INSIGHT_RESOLVED). Prevents re-resolving and cross-user insight mutation.
- `SavedListItem` upsert (`src/routes/lists.ts`) on composite PK `[listId, recipeId]` — safe to retry under network double-tap; no constraint error surfaces to the client.
- Rate limiter fail-open on Redis error (`src/middleware/rateLimit.ts:134-136`): logs warn and allows request through — correct sentinel behaviour, documented intent.

**New boundary gaps:**
- `POST /recipes` save handler (`src/routes/recipes.ts:915`): no length bounds on `ingredients`, `steps`, or `userPreferences` arrays — the 50-item / 50-char caps applied at generate time are not re-checked at save time, leaving a direct-API attack surface.
- `PATCH /users/me` email change (`src/routes/users.ts:1695`): no `emailVerified: false` reset and no re-verification email — silent verified-state lie introduced on every email update.
- `POST /flows/:id/response` dietary step (`src/routes/flows.ts:55`): 3-filter cap from `PATCH /users/me/preferences` not replicated — flow-applied preferences can exceed the limit with no log or rejection.
- `POST /records/start` `servings` param: validated as `> 0` but no upper bound — a client can store `servings: 999999` in a CookRecord with no rejection.
## ASSET:bug 2026-06-23 21:39 → Strong error-handling baseline; four failure modes lack alerts or correction

**Well-covered paths:**
- Rate limiter fails open on Redis error (`src/middleware/rateLimit.ts:134-136`): warns and allows request through — correct sentinel behaviour
- Recipe generation failure triggers `chatAlert` (`src/routes/recipes.ts:1044-1046`) and returns 500 with a user-facing message
- `findRecipeVideo`, `generateOgImage`, `runInsightAnalysis` all fail silently via `.catch()` — appropriate for fire-and-forget paths
- `process.on("unhandledRejection")` and `process.on("uncaughtException")` registered in `src/index.ts`
- Apple auth failure triggers `chatAlert` (`src/routes/auth.ts:451-452`)

**Gaps:**
- `pushRowToGitHub` failure logs only a `console.warn` — auth metric data is silently lost; no alert and only retries on HTTP 409 SHA conflicts, not network errors
- Pantry TOCTOU race produces no log — an over-cap item is silently created with no warning
- `runInsightAnalysis` Redis failure propagates to caller as `console.warn` only — no alert on repeated Redis outages blocking all insight generation
- No dead-queue detection in OllamaProvider: once `this.queue` is rejected every caller receives a throw but nothing resets it
- `src/routes/users.ts:1802-1808` uses `as any` casts for `ageRange`/`gender` enum validation, suppressing TypeScript safety at a user-input boundary
## ASSET:backend 2026-06-23 16:38 → Bug prevention inventory update — new insight race risk, YouTube quota guard absent; existing defences unchanged

**New risk since June 13:**

| Risk | Location | Severity | Status |
|---|---|---|---|
| Insight duplicate on concurrent save after unique constraint drop | `src/services/ai/insights.ts` | Low (Redis cooldown mitigates 99%) | Open |
| YouTube quota exhaustion on every generate (not just save) | `src/routes/recipes.ts` generate handler | Medium (100 generates/day hits limit) | Open |

**Defences confirmed still present:**

*Input validation:*
- Register: email ≤100 chars, name ≤50, password 8–128
- Generate: ingredients non-empty, each trimmed to ≤50 chars, max 50 items, servings positive, dietaryFilters enum-validated
- Recipe note: ≤500 chars
- Pantry: trimmed, non-empty, cap 50 enforced (still non-atomic for different ingredients — Bug 1)
- Profile update: ageRange and gender validated against allowlists; newPassword 8–128
- Lists: name non-empty, trimmed; max 5 lists enforced via count check (same race surface as pantry)
- Cook records: recipeId required, ownership verified via `findFirst({ userId })`
- Recipe review: stars validated 1–5

*Duplicate-key / race handling:*
- Pantry add: catches P2002 → 409 (same ingredient only; different-ingredient cap race still open)
- Recipe share: idempotent, returns existing token
- UserFlowView: upsert pattern
- Rate limit: atomic Lua INCR+EXPIRE
- SavedListItem: upsert prevents duplicate adds to same list

*Auth hardening (unchanged):*
- JWT on all protected routes
- `requireAdmin` DB role check on `/admin/*` routes
- Auth endpoints rate-limited 10 req / 15 min
- bcrypt cost 12
- Password reset tokens: 1hr expiry; email verification tokens: 24hr expiry
## ASSET:back 2026-06-23 15:14 → Bug inventory — location, severity, and reproduction path

| # | Issue | File | Severity | Notes |
|---|---|---|---|---|
| 1 | No auto verification email on register | `src/routes/auth.ts` POST /register | Medium | sendVerificationEmail never called at registration |
| 2 | Unbounded ogImageBase64 on save | `src/routes/recipes.ts` POST / | Low-Medium | No max-size check before writing Bytes to DB |
| 3 | Dual pluralStem — simpler one misses irregular plurals | `src/routes/recipes.ts` ~L1021 | Low | cookRecords.ts version is more correct |
| 4 | GET /recipes truncates at 500, no signal to client | `src/routes/recipes.ts` GET / | Medium | Hard `take: 500`, no totalCount in response |
| 5 | Discover feed LIMIT 20, no pagination | `src/routes/recipes.ts` GET /discover | Low-Medium | Raw SQL, no cursor support |

---
## ASSET:backend 2026-06-23 14:32 -> Bug prevention inventory update — new validations in cookRecords and insights, pluralStem correctness, atomic rate limit still in place

**New validations added (cookRecords):**
- `POST /records/start`: validates `recipeId` is a non-empty string; queries recipe with `{ id: recipeId, userId: req.userId! }` — prevents cross-user record injection.
- `PATCH /records/:id/complete` and `/abandon`: fetches record with `{ id, userId: req.userId! }` before update — no IDOR path.
- `pluralStem()` handles irregular plurals (`men→man`, `children→child`, etc.) and invariant forms (`/ee$/` guard prevents `cheese→chees`, `coffee→coffe`). Reduces false-positive pantry mismatches in `stemMatch()`.

**New validations added (insights):**
- `PATCH /insights/:id`: status must be strictly `"accepted"` or `"dismissed"` (400 otherwise).
- Ownership check: `insight.userId !== req.userId` → 404.
- State guard: `insight.status !== "pending"` → 400 (`INSIGHT_RESOLVED`).

**Existing protections unchanged:**
- Rate limit Lua eval in `rateLimit.ts`: `INCR` + `EXPIRE` in single atomic call — no race window.
- Admin bypass is DB role-checked (`prisma.user.findUnique`) not JWT-trusted.
- Pantry cap (50) still enforced in `routes/pantry.ts`.
- Recipe generate: ingredients array non-empty, each ≤50 chars, max 50 items, servings positive, dietaryFilters enum-validated.
## ASSET:bug 2026-06-23 11:23 → Error handling coverage: Redis fail-open, fire-and-forget alert paths, validation boundaries

- Rate limiter: Redis errors caught and logged; request proceeds (fail-open) — intentional but undocumented behaviour
- Insights trigger: `runInsightAnalysis(...).catch(console.warn)` — fire-and-forget; exceptions silently swallowed after save
- GitHub auth metric push (`pushRowToGitHub`): no persistent queue; on failure after 2 attempts, row is permanently dropped with `console.warn`
- Google Chat / Slack alerts: `.catch(() => {})` — silent failure on webhook errors
- Claude: 30s `AbortSignal.timeout`; on failure falls back to Ollama and sets `fallback=true` in metrics CSV
- Ollama: 65s `AbortSignal.timeout`; on failure propagates error to caller (recipe generation returns 500)
- YouTube: 5s manual `AbortController`; on failure returns `null` — recipe saved without video link
- Input validation: ingredients capped at 50 items, each trimmed to 50 chars; password 8–128 chars; name ≤50 chars; email ≤100 chars; descriptionNote ≤500 chars
- `register` does not send a verification email — `emailVerified` stays false indefinitely until user manually requests resend
- `dump.rdb` in repo root: Redis snapshot, potential production data exposure

---
## ASSET:backend 2026-06-22 20:06 -> Idempotent share token, duplicate save guard, and list upsert prevent data integrity issues under repeated client taps

**Idempotent share token generation (`src/routes/recipes.ts:800-809`)**
`POST /recipes/:id/share` returns the existing `shareToken` if the recipe is already shared, rather than generating a new one. Multiple taps produce the same URL; the `@unique` constraint on `shareToken` is never violated by the application layer.

**Duplicate save guard (`src/routes/recipes.ts:362-368`)**
`POST /recipes` checks for an existing recipe with the same title saved within the last 24 hours before creating a new record. The guard logs a warning rather than blocking — correct behaviour, since a user may legitimately save two identically-titled recipes. Ops visibility without a hard rejection.

**`SavedListItem.upsert` in list assignment (`src/routes/lists.ts:2339-2343`)**
Adding a recipe to a list uses `upsert` on the composite PK `[listId, recipeId]`, making the operation safe to retry. Prevents constraint errors from double-taps on the UI without requiring client-side deduplication.
## ASSET:bug 2026-06-22 11:51 → Bug inventory snapshot June 2026

| # | File | Line(s) | Description | Severity |
|---|---|---|---|---|
| 1 | src/routes/recipes.ts | 1659–1660 | `groceryMatchCount = pantryUsed.length` — duplicates pantryMatchCount; groceryPct is wrong | Medium |
| 2 | src/services/ai/provider.ts | ~1007 | `inferEmojiFromTitle` uses `lastIndexOf` — later-in-string keyword wins over more-specific earlier match | Low |
| 3 | src/routes/users.ts | ~2371 | `GET /users/me` returns 401 for deleted-user token; should be 404 | Low |
| 4 | src/routes/users.ts | ~2641–2659 | `DELETE /users/me` performs sequential deletes outside a transaction — orphan risk on crash | Medium |
| 5 | src/routes/auth.ts | ~115–159 | `pushRowToGitHub` IIFE silently drops auth metric rows on 409 conflict after 2 retries | Low |
## ASSET:backend 2026-06-22 11:03 → Rate limit, auth, and recipe-save guards are correctly implemented

**Rate limit atomicity** — Lua INCR+EXPIRE in a single Redis call correctly prevents the classic double-increment race. Admin role bypasses rate limiting, confirmed in code.

**HTML escape in password reset forms** — `escHtml()` is applied to all user-supplied strings rendered in HTML responses (`/auth/reset-password-redirect`, `/auth/reset-password-form`). Token value in hidden input uses `${safeToken}` (escaped). XSS vector is closed.

**Duplicate recipe guard** — `POST /recipes` checks for an existing recipe with the same title created in the last 24 hours before saving. This prevents accidental double-saves from network retries without blocking legitimate same-title saves across days.

**Apple JWT verified correctly** — `identityToken` is decoded to extract `kid`, matched against cached Apple JWKS, and verified using Node's native `crypto.createPublicKey`. Audience is validated as `com.toifood.app`, issuer as `https://appleid.apple.com`.

**Auth metric IP filtering** — Local IPs (`127.0.0.1`, `::1`, `::ffff:127.0.0.1`) are excluded from auth metric logs, so internal health checks and local test calls don't pollute the CSV.
## ASSET:bug 2026-06-13 18:11 → Structured error codes, multi-layer emoji fallbacks, and defensive AI output parsing

All auth and API routes return structured error objects with `code` strings (`MISSING_FIELDS`, `EMAIL_EXISTS`, `TOKEN_INVALID`, `PANTRY_LIMIT_EXCEEDED`, `LISTS_LIMIT_EXCEEDED`, etc.), enabling reliable client-side error handling without string matching. `extractFoodEmoji` has a four-layer fallback (AI emoji gate → title keyword inference → ingredient inference → `🍽️`), preventing empty emoji fields. `OllamaProvider` strips CJK characters from all string fields defensively against `qwen2.5` bleed-through. `ClaudeProvider` strips markdown code fences before JSON parsing. The rate limiter catch block logs the Redis error and allows the request through rather than returning 500 to users.
## ASSET:bug 2026-06-13 17:04 → Exact line locations and fix surfaces for each bug

**Bug 1 — ageRange/gender null-clear:**
- `src/routes/users.ts:1567` — ageRange validation
- `src/routes/users.ts:1572` — gender validation
- Type hint: parameter typed as `string | null` but null rejected

**Bug 2 — groceryMatchCount naming:**
- `src/routes/recipes.ts:286` — `groceryMatchCount = pantryUsed.length`
- `src/routes/recipes.ts:287` — `groceryPct` derived from it
- Downstream: RECIPE-METRIC.csv column `groceryMatchCount`; digest reads this column in `buildRecipeStats`
- Suggested rename: `pantryInRecipeCount` or `pantryOverlapCount`

**Bug 3 — pluralStem divergence:**
- Simple (buggy): `src/routes/recipes.ts:257-262`
  - Missing `ee` invariant: `pluralStem("cheese")` → `"chees"`
- Full (correct): `src/routes/cookRecords.ts:1984-2002`
  - Has IRREGULAR table (leaves→leaf, geese→goose, etc.)
  - Has `ee` invariant guard
- Fix: extract full version to `src/lib/pluralStem.ts`, import in both files

**Minor — Apple JWK cast (`src/routes/auth.ts:1120`):**
`(keys as any[]).find(...)` bypasses TypeScript on a `JsonWebKey[]` — not a runtime bug but worth removing
## ASSET:bug 2026-06-09 18:16 â†’ UUID-based resource IDs make enumeration attacks impractical; JSON body parser returns 400 on malformed input before any handler runs; length-capped text fields prevent DB column overflow

**UUID resource IDs close enumeration attack surface:**
- All primary keys are UUIDs, not sequential integers. Guessing a valid recipe, list, or user ID requires enumerating 128 bits of entropy rather than incrementing a counter. Combined with the `{ id, userId: req.userId }` ownership check on every mutable route, an attacker must know both a valid UUID and own the resource â€” making IDOR attacks impractical without account compromise.

**JSON body parser as a first-line defence:**
- `express.json()` is the first middleware in the stack â€” malformed JSON (truncated payloads, invalid escapes, oversized arrays) returns 400 before any route handler runs. Route handlers never see partially-parsed request bodies, eliminating a class of null-dereference bugs in route-level parsing code.

**Text field length caps prevent column overflow:**
- All user-supplied text fields have explicit length limits enforced in route handlers: email â‰¤ 100, name â‰¤ 50, password 8â€“128, ingredient trimmed. PostgreSQL `varchar` columns without a constraint would accept arbitrarily long strings; these application-layer caps prevent both DB column overflow and storage-amplification attacks where a single malicious request writes megabytes to the DB.

## ASSET:bug 2026-06-09 18:03 â†’ Prisma P2002 catch pattern established for pantry dedup; enum validation at boundaries prevents garbage data; bcrypt/12 + JWT ensure auth bug surface is small

**P2002 catch pattern for idempotent inserts:**
- `POST /pantry` catches Prisma `P2002` (unique constraint violation) and returns 200 instead of 500 â€” the same pattern should be applied to `RecipeReview` and `UserInsight` upserts to prevent duplicate-key crashes from propagating as 500 errors.

**Enum validation prevents downstream bugs:**
- All DietaryFilter, continent, gender, ageRange, and UserRole values are validated against explicit enum sets before reaching DB. An invalid enum value never reaches Prisma â€” error is returned at the route layer with a clear 400 message, not a cryptic DB error.

**Auth bug surface is minimal:**
- bcrypt cost factor 12 makes brute-force impractical even if the hash table is exposed
- JWT 7-day expiry with secret validated at startup â€” expired tokens return 401 before any DB query runs
- `express-rate-limit` on auth routes (10 req/15 min/IP) prevents password spraying
- Apple and Google identity verified server-side â€” no client-supplied claims are trusted

**Ownership model eliminates IDOR class:**
- Every fetch/mutate on user-owned resources (recipes, lists, pantry, records, insights) requires `{ id, userId: req.userId }` match â€” a correct userId in the JWT and correct resource id are both required. This pattern is consistent across all mutable routes, meaning IDOR bugs require both a valid user account AND guessing another user's resource IDs (UUIDs).

**Request parsing safety:**
- `express.json()` body parser in use â€” malformed JSON returns 400 before any route handler runs
- All text fields that could be user-supplied (name, email, ingredient) are length-capped and trimmed before DB write
## ASSET:bug 2026-06-07 16:30 â†’ Strong validation on all input boundaries; ownership checks on all mutable routes; Prisma unique constraints prevent duplicates; auth rate limiting

**Input validation coverage:**
- `POST /auth/register`: email â‰¤100 chars, name â‰¤50 chars, password 8â€“128 chars â€” all validated before DB write
- `PATCH /users/me/preferences`: DietaryFilter enum validation, max 3 filters enforced, valid continent list enforced
- `PATCH /users/me`: ageRange and gender validated against explicit enum lists before DB update
- `POST /pantry`: ingredient trimmed, 30-item cap enforced, duplicate checked atomically (unique constraint + P2002 catch)
- `POST /lists`: max 5 lists per user enforced before creation

**Ownership guards on all mutations:**
- Every mutable route (records, pantry, lists, recipes) fetches the resource with `{ id, userId: req.userId! }` â€” prevents IDOR attacks. No route updates by id alone.

**Duplicate prevention:**
- `PantryItem @@unique([userId, ingredient])` â€” DB-level duplicate guard with P2002 catch in route
- `RecipeReview @@unique([userId, recipeId])` â€” one review per recipe per user enforced at DB level
- `UserInsight @@unique([userId, category])` â€” single active insight per category per user

**Auth security:**
- bcrypt with cost factor 12 for password hashing
- JWT with 7-day expiry, secret checked at startup
- `express-rate-limit` on all auth endpoints: 10 requests / 15 minutes
- Apple Sign-In verified with RS256 against Apple's JWKS â€” no client-supplied identity accepted
- Google OAuth identity token verified server-side via Passport strategy
