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
## ISSUE:backend 2026-06-23 14:32 -> Three new bugs — STARTED records never auto-expire, insights accept race, digest.ts missing mkdir crashes silently

**Bug 1 — STARTED CookRecords never auto-timeout** (`src/routes/cookRecords.ts`)
No scheduled job, TTL, or sweep transitions `CookRecord` rows stuck in `STARTED`. If the user's app crashes or closes without calling `/complete` or `/abandon`, the record stays `STARTED` indefinitely. `GET /records` returns all records with no status filter, so stale `STARTED` rows appear in the user's history. The `ABANDONED` status exists but has no automatic path.

**Bug 2 — Insights accept race condition** (`src/routes/insights.ts` PATCH `/:id`)
The auto-apply block for accepted dietary insights:
```ts
const existing = await prisma.dietaryPreference.findMany({ where: { userId } });
if (existing.length < 3) {
  await prisma.dietaryPreference.create({ ... });
}
```
Two concurrent requests (different insight IDs, both dietary) that both read `existing.length < 3` will both call `create`, producing 4+ preference rows and bypassing the 3-filter cap enforced in `PATCH /users/me/preferences`.

**Bug 3 — `digest.ts` crashes silently if `would/` directory is absent**
`src/digest.ts` calls `fs.appendFileSync(filePath, row)` on `would/DIGEST-METRIC.csv` without checking whether the directory exists. `src/routes/recipes.ts` guards with `fs.mkdirSync(dir, { recursive: true })` before writing — `digest.ts` does not. On a fresh deploy or restore where `would/` was not created, the digest process throws, the catch block in the IIFE swallows it, and no Google Chat alert is posted for that day.
## ISSUE:bug 2026-06-23 11:23 → Dietary filters silently dropped on Claude→Ollama fallback; hardcoded infra path; two divergent pluralStem implementations

1. `src/routes/recipes.ts` POST /recipes/generate: when Claude fails and Ollama handles the request, `dietaryTags` is set to `[]` in the response (`usedProvider === "claude" ? validFilters : []`). The user's dietary restrictions are silently not applied — no warning is returned to the client, meaning a user with e.g. "Vegan" may receive a non-vegan recipe without any indication.
2. `src/digest.ts:224` hardcodes `/Users/jayagent/.openclaw/logs/infra_health.log` — will always return "infra_health.log not found" on any deployment except the specific named machine.
3. `pluralStem` is implemented twice: a full version in `src/routes/cookRecords.ts` (handles irregular plurals, `ee` invariants) and a simplified regex-only version inline in `src/routes/recipes.ts`. The two diverge for edge cases ("geese", "cheese", "feet"), causing inconsistent pantryUsed matching between cook records and recipe saves.
4. `src/services/ai/insights.ts`: `UserInsight` has no DB-level unique constraint on `(userId, category, status=pending)`. The `findFirst + update/create` pattern has a race window if two recipe saves trigger `runInsightAnalysis` concurrently for the same user, potentially creating duplicate pending insights per category.
5. `dump.rdb` is committed to the repository root — a Redis RDB snapshot that may contain production rate-limit counters or cached keys.

---
## ISSUE:backend 2026-06-22 20:06 -> Three confirmed bugs — register skips verification email, Play Store API path wrong, chat bot unauthenticated

**1. `POST /auth/register` never sends a verification email**
`src/routes/auth.ts:1161-1169`: user is created with `emailVerified: false`, a JWT is returned, and `sendVerificationEmail` is never called. The function is imported but unused in this path. Users can operate the app indefinitely with an unverified email. Only `POST /auth/resend-verification` (a separate, user-initiated call) triggers a verification email. OAuth flows (Google, Apple) also set `emailVerified: false` on creation.

**2. Play Store API resource path uses package name where project number is required**
`src/services/playstore.ts:4064-4073`: `fetchRateMetric` constructs `name: projects/${packageName}/apps/${packageName}/${metricSet}`. The Play Developer Reporting API v1beta1 expects a numeric project number in the first segment (`projects/<projectNumber>/apps/<packageName>/...`), not the package name (e.g., `com.toifood.app`). All `crashRateMetricSet` and `anrRateMetricSet` queries fail silently (caught → null), so `crashRate7d` and `anrRate7d` are always null in the admin store-metrics response.

**3. `/api/chat` POST is reachable without authentication**
`src/routes/chat.ts:2647`: no `requireAuth` middleware. `!logs` streams the last 20 PM2 log lines (may contain user IDs and error details). `!status` reveals process names and memory. The endpoint accepts arbitrary HTTP POST requests — there is no Google Chat request signature check (`google-auth-library` or header validation).
## ISSUE:bug 2026-06-22 11:51 → groceryMatchCount metric bug; emoji inference lastIndexOf logic inverts specificity

**Bug 1 — groceryMatchCount is wrong** (`src/routes/recipes.ts:1659`): `groceryMatchCount` is assigned `pantryUsed.length` — the count of pantry items used — instead of the count of recipe ingredients not sourced from pantry. The downstream `groceryPct` becomes `pantryUsed / totalIngredients` (pantry utilisation) rather than the intended grocery requirement rate. Both `pantryPct` and `groceryPct` columns in the RECIPE-METRIC.csv and in the generate response `pantryStats` are therefore measuring the same thing.

**Bug 2 — emoji inference uses `lastIndexOf` which defeats specificity ordering** (`src/services/ai/provider.ts:1007`): `inferEmojiFromTitle` iterates `TITLE_KEYWORD_EMOJI` (ordered most-specific first) using `lastIndexOf` and keeps whichever keyword appears latest in the string. A title like "Lemon Chicken Stir-fry" matches "lemon" at pos 0 and "stir-fry" at pos 14 — stir-fry wins because it appears later, overriding the more-specific match. Should use `indexOf` (first occurrence) or compare match length.

**Bug 3 — DELETE /users/me returns 401 for missing user** (`src/routes/users.ts:2371`): When a valid JWT token belongs to a deleted user, `GET /users/me` responds with `status(401)` and code `USER_NOT_FOUND`. 401 means unauthorised; the token is valid but the account is gone — the correct status is 404.

**Bug 4 — DELETE /users/me is non-atomic**: Sequential deletes across `DietaryPreference`, `PasswordResetToken`, `EmailVerificationToken`, `Recipe`, then `User` are not wrapped in a transaction. A crash mid-sequence leaves orphaned data with no cleanup path.
## ISSUE:backend 2026-06-22 11:03 → groceryMatchCount metric is wrong, Ollama ignores continentPreferences, and /users/:id/profile is unauthenticated

**`groceryMatchCount` wrong value** (`src/routes/recipes.ts` ~line 286-287) — The metric is intended to count how many recipe ingredients the user needs to buy (i.e., not in pantry). But the code sets:
```ts
const groceryMatchCount = pantryUsed.length; // same as pantryMatchCount
```
This should be `totalIngredients - pantryUsed.length`. The CSV column `groceryPct` is therefore also incorrect: it computes pantry-match percentage twice rather than the grocery fraction. Any analytics on pantry efficiency derived from this column are skewed.

**Ollama ignores `continentPreferences`** (`src/services/ai/ollama.ts`) — `pickRegion()` is called with no arguments, so Ollama always picks from the full `COUNTRY_REGIONS` pool regardless of the user's continent settings. Claude correctly passes `request.continentPreferences` to `pickRegion()`. Users who set continent preferences get them applied only when using Claude.

**`GET /users/:id/profile` unauthenticated** (`src/routes/users.ts`) — The public profile endpoint has no `requireAuth` middleware. Any caller who knows or enumerates a user CUID can request their profile and receive name, role, recipe counts, and dietary/cuisine breakdowns (subject to privacy settings). The privacy settings gate field values but cannot prevent confirming that an account exists.

**`storeReport.ts` will crash on run** — Reads and writes to `-ARCHIVE/-WOULD/usage-issue-v1.md` and `-ARCHIVE/-WOULD/usage-asset-v1.md` using `fs.readFileSync`, which will throw `ENOENT` because these directories don't exist in the current repo. If `storeReport.ts` is part of any cron or pm2 job, it will error silently or crash.
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
