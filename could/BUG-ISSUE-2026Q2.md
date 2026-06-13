ISSUE LOG - BUG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:bug {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Unhandled rejections, null dereferences, async race conditions, edge cases that could fail silently in prod

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:bug 2026-06-13 18:11 → Google OAuth callback URL ignores version prefix; insights Redis throws are unhandled

In `src/routes/auth.ts`, the Google OAuth `callbackURL` is `${APP_URL}/auth/google/callback` — the legacy path. The versioned route is `/1-1-1/auth/google/callback`. If legacy routes are removed, Google OAuth silently breaks. In `src/services/ai/insights.ts`, the Redis `set(..., 'NX')` call can throw on a connection error; this throw is not caught, causing `runInsightAnalysis` to produce an unhandled rejection mid-recipe-generation. In `cookRecords.ts`, `stemMatch` uses `as.includes(bs)` substring inclusion — a short pantry entry like `"oil"` incorrectly matches recipe ingredients `"foil"` or `"broil"`. `src/storeReport.ts` references a hardcoded `-ARCHIVE/-WOULD/` path that does not exist in the repo and crashes immediately on any fresh checkout.
## ISSUE:bug 2026-06-13 17:04 → ageRange/gender null-clear blocked by validation; pluralStem duplicated with divergent correctness

**Bug 1 — ageRange and gender cannot be cleared (`src/routes/users.ts:1567-1574`).**
`PATCH /users/me` accepts `ageRange: string | null` to clear the field, but the validation `!VALID_AGE_RANGES.includes(ageRange as any)` evaluates to `true` when `ageRange` is `null` (null is not in the array), returning 400. A user who previously set their age range cannot remove it. Same issue on the gender check at line 1572.

Fix:
```ts
// Before
if ("ageRange" in req.body && !VALID_AGE_RANGES.includes(ageRange as any)) { ...400... }
// After
if ("ageRange" in req.body && ageRange !== null && !VALID_AGE_RANGES.includes(ageRange as any)) { ...400... }
```

**Bug 2 — `groceryMatchCount` is misnamed (`src/routes/recipes.ts:286`).**
`groceryMatchCount = pantryUsed.length` counts pantry items used in the recipe, not grocery (non-pantry) items. The derived `groceryPct = groceryMatchCount / totalIngredients` measures pantry coverage of the full ingredient list — a valid metric — but the column name in RECIPE-METRIC.csv implies the opposite meaning, which will mislead future data analysis.

**Bug 3 — `pluralStem` duplicated with divergent correctness.**
Two implementations: `src/routes/recipes.ts:257-262` (3 regex rules) and `src/routes/cookRecords.ts:1984-2002` (IRREGULAR table + invariant rules). The simpler version incorrectly stems `"cheese"` → `"chees"` (missing the `ee` invariant guard). These affect pantry match accuracy and should be unified.
## ISSUE:bug 2026-06-09 18:16 â†’ 4 production risks: PATCH /insights/:id action field unvalidated, shareToken OG endpoint has no rate limit, GET /stats full table scan before cache warms, chat route auth state unknown

**1. `PATCH /insights/:id` action field not strictly validated:**
- The endpoint accepts `action: "accept" | "dismiss"` but if the request body `action` is not validated against an explicit allowlist before reaching the update logic, an unrecognised value (e.g., `"delete"`, `""`, `null`) could reach a switch or conditional without a matching branch, silently returning 200 with no state change. The user believes their interaction was recorded; no error is returned; and the insight remains in its pre-action state indefinitely.

**2. Recipe shareToken endpoint likely unrate-limited:**
- `Recipe.shareToken` is a unique identifier for OG image sharing (used in `og:` meta tags). The endpoint that serves OG data by shareToken (likely `GET /recipes/:shareToken/og` or similar) is likely unauthenticated (public by design for social sharing). If it is not rate-limited, an attacker can enumerate UUIDs to harvest public recipes without any throttle. A rate limit of 20 req/min/IP on this endpoint would close the enumeration window without affecting legitimate sharing.

**3. `GET /stats` may run a full table COUNT before 60s cache warms:**
- `GET /stats` returns `{ recipesGenerated, cooksJoined }` with a 60s in-memory cache. On a fresh process start (after pm2 restart), the cache is empty. The first request triggers a `COUNT(*)` on the recipes table and likely the users or cook_records table. On a PostgreSQL table with 10K+ rows and no index on a computed counter, this is a full sequential scan in the request path. Under a burst of cold-start requests (e.g., monitoring pings after a deploy), multiple concurrent scans could execute before the cache fills.

**4. `src/routes/chat.ts` auth state unknown â€” potential unauthenticated AI access:**
- The chat route is mounted and production-serving, but its authentication requirements are undocumented. If it omits the `requireAuth` middleware that all other user-facing routes use, it is open to unauthenticated AI calls. An unauthenticated caller could drive unlimited AI provider cost with no rate limit applied (rate limit middleware requires `req.userId` from a valid JWT).

## ISSUE:bug 2026-06-09 18:03 â†’ 5 additional production risks: insight upsert P2002 unhandled, JWT expiry not checked on password reset, concurrent list cap bypass, JSON schema drift silent, CookRecord status transition allows re-start

**1. Insight upsert P2002 not caught (`insights.ts`):**
- `prisma.userInsight.upsert` on `@@unique([userId, category])` can throw P2002 under concurrent execution (two parallel recipe saves for the same user). No try/catch exists around the upsert â€” the error propagates as an unhandled promise rejection, causing the recipe save to return 500.

**2. JWT not re-verified on password reset form submit:**
- `POST /auth/reset-password-form` receives `token` from form body and injects it into the response HTML. The token is validated for DB existence but if JWT expiry validation is skipped at the form-submit stage (vs. form-display stage), an expired token in a cached browser form can be submitted and accepted after the 1-hour window.

**3. Concurrent list creation bypasses 5-list cap:**
- `POST /lists` checks `count < 5` then creates a new list. Under concurrent requests (mobile client double-tap or network retry), two requests can both pass the count check before either inserts â€” result: 6+ lists created, exceeding the cap. No DB-level constraint enforces the 5-list limit.

**4. JSON column schema drift goes undetected:**
- `CookRecord.ingredients`, `UserInsight.data`, `FlowStep.content`, and `UserFlowView.responses` are all `Json` columns. If the AI service changes its output format (e.g., flattens a nested object), old and new data coexist in the same column with no validation or migration. Parsing code that expects the old shape will silently fail or return undefined fields.

**5. CookRecord allows re-starting a completed session:**
- `POST /records/start` creates a new record tied to a `recipeId`. There is no check for an existing `STARTED` or `COMPLETED` record for the same `userId + recipeId`. A user can start the same recipe multiple times in parallel, inflating cook session counts and potentially triggering duplicate insight analysis runs.
## ISSUE:bug 2026-06-07 16:30 â†’ 6 production bug risks: unawaited placeholder init, Apple JWKS no cache, rate-limit race, HTML injection, missing email cascade, stemMatch false positives

**1. Unawaited `initPlaceholder()` (recipes route startup):**
- `initPlaceholder()` is called but not awaited at module load time. If canvas initialization takes time, the first recipe OG image request before the placeholder is ready returns null. Race condition at startup.

**2. Apple JWKS fetch on every auth call:**
- `POST /auth/apple` fetches `https://appleid.apple.com/auth/keys` on every request with no caching. Under concurrent Apple sign-ins, this fires N simultaneous external HTTP requests. If Apple throttles or returns 429, all concurrent sign-ins fail simultaneously.

**3. Rate limit INCR/EXPIRE race condition (`rateLimit.ts` lines ~70â€“72):**
- `redis.incr(key)` followed by a conditional `redis.expire(key, 3600)` only if `count === 1`. Under concurrent requests, two requests can both see `count === 1` before either sets the expiry â€” the key then never expires and permanently blocks the user. Should use a Lua script or `SET NX EX` atomic operation.

**4. HTML injection in password reset form (`auth.ts`):**
- `reset-password-form` POST handler injects `${token ?? ""}` directly into HTML response without escaping. A malformed token containing `<script>` would execute in the browser. The token is from the request body (not DB-validated at that point), so this is an XSS vector.

**5. EmailVerification token not cleaned up on user delete:**
- `DELETE /users/me` manually deletes `emailVerificationToken` but does NOT check if there are `DietaryPreference` records with a cascade issue â€” actually it does delete them. However, if a user has an active `EmailVerificationToken` that was already consumed but the row wasn't deleted (edge case), the delete will fail with a FK constraint.

**6. `stemMatch` false positives in pantry matching:**
- `pluralStem()` in `cookRecords.ts` is a naive plural stripper. "tomatoes" â†’ "tomato" works, but "eggs" â†’ "eg", "peas" â†’ "pea", "cheese" â†’ "chees". These stems can cross-match unrelated ingredients (e.g., "chees" matches "cheesecake"), causing incorrect pantry/grocery categorization in cook records.
