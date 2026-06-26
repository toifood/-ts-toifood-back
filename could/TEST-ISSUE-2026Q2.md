ISSUE LOG - TEST
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:test {YYYY-MM-DD HH:MM} → {CONTENT}

CUSTOM PROMPT:
Missing test coverage, untested edge cases, flaky tests, gaps in integration and e2e tests

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:test 2026-06-27 10:49 → Password reset flow, user update, cook-record lifecycle, and admin guard have no test coverage

**Finding — `src/__tests__/auth.test.ts` (password reset and email verification flows missing)**
The full email-based flows — `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/verify-email`, and `POST /auth/resend-verification` — are absent from the test suite. These flows involve token creation, expiry checks, and database state transitions that are difficult to verify manually and easy to break silently.

**Finding — `src/__tests__/users.test.ts` (missing or incomplete)**
`PATCH /users/me` (name, email, password update), `PATCH /users/me/preferences`, `PATCH /users/me/privacy`, and `DELETE /users/me` have no test coverage. The email-change-without-reverification bug (`emailVerified` never reset) is invisible to CI because the update path is entirely untested.

**Finding — `src/__tests__/cookRecords.test.ts` (missing)**
The cook record lifecycle — `POST /records/start` (pantry ingredient matching via `pluralStem`/`stemMatch`), `PATCH /:id/complete`, and `PATCH /:id/abandon` — has zero coverage. The stemming logic (irregular plurals, `ee` invariant guard, standard `-s` stripping) is the most likely source of silent regressions in the cook flow.

**Finding — `src/routes/admin.ts` (requireAdmin guard untested)**
`requireAdmin` is a middleware applied to all admin routes. Both the 403 rejection path (non-admin user) and the 200 success path (admin user) are untested. A refactor that breaks the admin guard would pass all current tests undetected.
## ISSUE:test 2026-06-26 19:17 → Core generation path and rate-limit middleware have zero test coverage

**Finding — `src/__tests__/recipes.test.ts` (missing generate coverage)**
`POST /recipes/generate` is the most complex route in the codebase — AI provider selection, Claude→Ollama fallback, `pantryUsed` derivation, ingredient sanitisation, OG image generation, YouTube fetch, and metrics writing. The test file mocks `runInsightAnalysis`, `chatAlert`, and `findRecipeVideo` but never calls `/generate` once. Any regression in the fallback path or the `pluralStem` pantry derivation is completely invisible to CI.

**Finding — `src/middleware/rateLimit.ts` (no tests)**
The Redis Lua script for atomic increment-and-expire, the role-based limit table (`free: 3/2`, `premium: 10/5`, `admin: 999/999`), the admin bypass, and the `getRecipeUsage` Redis-down fallback all have zero coverage. The rate limiter is the primary abuse-prevention mechanism; a silent regression here would allow unlimited generation.

**Finding — `src/services/ai/insights.ts` (runInsightAnalysis untested)**
`insights.test.ts` exercises only the HTTP GET/PATCH layer. The actual `runInsightAnalysis` function — weekly Redis cooldown key, 5-recipe minimum, per-category dismissed-category skip, and the five analysis sub-functions — has no test. The Ollama `ollamaSuggest` timeout/fallback path is also untested.

**Finding — `src/__tests__/auth.test.ts` (Apple and Google flows missing)**
`POST /auth/apple` (JWKS cache, RS256 `jwt.verify`, email fallback for private relay) and the Google OAuth callback are untested. These are the most integration-heavy auth flows and the first place to break if Apple rotates keys or the bundle ID changes.
## ISSUE:test 2026-06-26 13:51 → runInsightAnalysis cooldown-before-threshold ordering untested; cook record invalid status transitions untested; analyzePantry stemming gap untested; pushRowToGitHub retry logic untested; duplicate recipe title check untested

**`runInsightAnalysis` cooldown-set-before-MIN_RECIPES ordering has no test** (`src/services/ai/insights.ts`)
The cooldown Redis key is set before `recipes.length < MIN_RECIPES` is checked, permanently locking out analysis for new users for 7 days. No test seeds a user with < 5 recipes, calls `runInsightAnalysis`, asserts no cooldown key was set, then confirms a second call proceeds after the user reaches 5 recipes. The bug is invisible without this sequenced integration test.

**Cook record status-transition rules are entirely untested** (`src/routes/cookRecords.ts`)
`PATCH /:id/complete` and `PATCH /:id/abandon` have no coverage. Specifically, no test verifies that completing an already-ABANDONED record (or abandoning a COMPLETED one) is either rejected or accepted — the intended behaviour is undocumented and untested. A table-driven test covering all six `(from, to)` transitions would pin the contract.

**`analyzePantry` exact-match false-positive has no test** (`src/services/ai/insights.ts`)
No test seeds a pantry with "tomato" and a recipe history with "tomatoes", then verifies that the pantry insight does NOT suggest adding "tomatoes". The stemming gap produces wrong suggestions in production but is invisible in the test suite.

**`pushRowToGitHub` retry-on-409 logic is untested** (`src/routes/auth.ts`)
The two-attempt retry loop that re-fetches the file SHA on a 409 Conflict has no unit or integration test. The most likely failure mode — two simultaneous register calls racing on the same CSV SHA — has no regression coverage. Mocking the GitHub API to return 409 on first PUT and 200 on second would cover the core path.

**Duplicate recipe detection in `POST /recipes` is untested** (`src/routes/recipes.ts` ~line 370)
The 24-hour title-deduplication query runs on every save and logs a warning on match, but the save proceeds regardless. No test verifies: (a) the warning is logged, (b) a second save with the same title within 24 hours still returns 201 (not blocked), and (c) a save more than 24 hours later is not flagged.

**`storeMetrics` 1-hour in-memory cache has no test** (`src/routes/storeMetrics.ts`)
The module-level `cache` variable is never tested. No test verifies that a second request within TTL returns the cached response without calling `getAppStoreMetrics()` again, or that a post-TTL request re-fetches. The cache is also never externally invalidatable — that architectural gap is undocumented.
## ISSUE:test 2026-06-24 19:18 → Zero test files exist beyond helpers; pluralStem logic, Apple JWT, Ollama queue, discover SQL, and insights cooldown all fully untested

**No actual test files — only helpers exist**
`src/__tests__/helpers/auth.ts` and `src/__tests__/helpers/db.ts` are present but there are zero `*.test.ts` or `*.spec.ts` files in the tree. Running `vitest run` reports 0 tests. The full route surface (auth, recipes, users, pantry, lists, flows, insights, cookRecords, storeMetrics) has no test coverage at all.

**`pluralStem` / `stemMatch` logic is untested** (`src/routes/cookRecords.ts`)
The function handles irregular plurals (`leaves→leaf`, `geese→goose`, `women→woman`), invariant plurals (`/ee$/` → no-op to protect `cheese`), and two standard stripping rules. These edge cases are business-critical — a wrong stem match incorrectly classifies pantry items as grocery items (or vice versa) in cook records. A table-driven unit test suite covering all irregular and invariant cases is completely absent.

**OllamaProvider queue defeat has no regression test** (`src/routes/recipes.ts`, `src/services/ai/ollama.ts`)
Because a new `OllamaProvider()` is instantiated per request, the `.queue` property does nothing across concurrent requests. There is no integration test that fires two simultaneous `/generate` calls and asserts serialised Ollama invocations — the defect is invisible without one.

**Apple JWT verification path is untested** (`src/routes/auth.ts` `POST /auth/apple`)
The JWKS fetch from `https://appleid.apple.com/auth/keys`, key-id matching, RS256 `jwt.verify` with audience `com.toifood.app`, and the `upsert` fallback path are all untested. An Apple key rotation or a malformed `identityToken` format change could break sign-in silently.

**Discover feed raw SQL has no test** (`src/routes/recipes.ts` `GET /recipes/discover`)
The `Prisma.$queryRaw` query performs a lateral join for pantry match counting, computes `pantryPct` and `groceryPct`, filters at `groceryPct >= 20`, and masks `authorProfileVisibility` fields. No test verifies the scoring logic, the 20 % floor, or that a user cannot see their own recipes in the feed.

**Insight analysis Redis cooldown and dismissed-category suppression are untested** (`src/services/ai/insights.ts`)
The `NX` flag on the cooldown key, the 7-day `dismissed` category filter, and all five `analyze*` functions have no tests. The `analyzePantry` function does a raw string-match against pantry items (no stemming) which could produce false negatives for ingredients with different casing or trailing spaces.

**Rate limiter Lua script has no integration test** (`src/middleware/rateLimit.ts`)
The atomic INCR + EXPIRE Lua script, role-based limit lookup, and the `getRecipeUsage` response shape are untested against a real or mocked Redis instance.
## ISSUE:test 2026-06-24 10:24 → OllamaProvider continent preference drop, getAIProvider queue bypass, resend-verification email error path, list name bounds, and inactive-flow response are entirely untested

Zero test files remain (unchanged). New untested paths not covered by prior entries:

1. **`OllamaProvider` ignoring `continentPreferences`** (`src/services/ai/ollama.ts`) — A test constructing a `GenerateRecipeRequest` with `continentPreferences: ["Asia"]`, calling `OllamaProvider.generateRecipe`, and asserting the prompt captured by a mocked `fetch` contains a country from Asia would immediately expose that `pickRegion()` is called with no arguments. This also serves as a regression guard for any future continent-preference fix in the Ollama path.

2. **`getAIProvider()` per-call instantiation defeating queue serialization** (`src/services/ai/index.ts`, `src/services/ai/ollama.ts`) — A test calling `getAIProvider()` twice and asserting `result1 === result2` (same instance) would expose that a new `OllamaProvider` is constructed each time. An integration test firing two concurrent recipe generate requests via the route and asserting only one `fetch` call to Ollama was in flight at a time would verify queue serialization end-to-end.

3. **`POST /auth/resend-verification` email failure propagates as 500** (`src/routes/auth.ts`) — A test mocking `nodemailer.createTransport` to throw (simulating missing `GMAIL_USER`) should assert the endpoint returns a defined non-500 error code or, at minimum, a structured JSON body. Currently `sendVerificationEmail` is uncaught and the rejection propagates through the handler as an unhandled async throw, returning an empty 500.

4. **`POST /lists` and `PATCH /lists/:id` name length unbounded** (`src/routes/lists.ts`) — A test posting `name: "x".repeat(10_000)` should assert a 400 validation response. Currently the record is created successfully — the only protection is the global 2 MB body limit. A test asserting list creation is rejected above e.g. 100 characters would define and enforce the boundary.

5. **`POST /flows/:id/response` on a deactivated flow** (`src/routes/flows.ts`) — A test that (a) creates a flow, (b) sets `isActive: false` via `PATCH /admin/flows/:id`, (c) POSTs a preferences step response, then (d) asserts `prisma.dietaryPreference.count` is unchanged would expose that the handler does not gate on `flow.isActive`. This also guards against stale-client replays overwriting live user preferences.
## ISSUE:test 2026-06-24 09:27 → analyzePantry pantry-match correctness, duplicate STARTED guard, terminal-state enforcement, Ollama dietary filter drop, and insights Redis resilience are entirely untested

Zero test files remain (unchanged: no `*.spec.ts`/`*.test.ts`, no test script, no CI). New untested paths identified this pass that are not covered by prior entries:

1. **`analyzePantry` ingredient-string vs. pantry-name mismatch** (`src/services/ai/insights.ts`) — A test seeding a user with `flour` in their pantry and a saved recipe containing `"2 cups flour"` in its ingredients, then calling `runInsightAnalysis`, should assert the pantry insight does NOT suggest `"2 cups flour"` as a missing item. The test would immediately expose the `Set.has` exact-match bug.

2. **Duplicate STARTED `CookRecord` creation** (`src/routes/cookRecords.ts`) — A test calling `POST /records/start` twice in rapid succession for the same `userId + recipeId` should assert that only one STARTED record exists after both requests. Currently no guard exists and both writes succeed — an integration test hitting Prisma directly would expose this.

3. **Terminal-state enforcement on `PATCH /records/:id/complete` and `/abandon`** (`src/routes/cookRecords.ts`) — A test that (a) starts a record, (b) abandons it, (c) then calls `/complete` on the same record should assert a 400 or 409 error. Currently the complete succeeds silently, overwriting the ABANDONED state.

4. **`OllamaProvider` dietary filter drop** (`src/services/ai/ollama.ts`) — A test constructing a `GenerateRecipeRequest` with `dietaryFilters: [DietaryFilter.Vegan]`, calling `OllamaProvider.generateRecipe`, and asserting the prompt passed to `fetch` contains a dietary constraint would immediately reveal that `dietaryLine` is hardcoded to `""`. The test can mock `fetch` to capture the request body.

5. **`runInsightAnalysis` Redis cooldown no-op path** (`src/services/ai/insights.ts`) — A test calling `runInsightAnalysis` twice for the same `userId` within 7 days should assert no DB writes occur on the second call (Redis NX returns `null`). Without a test, a Redis misconfiguration or key eviction could silently allow weekly-cooldown bypass.

6. **`insights.ts` Redis error resilience** (`src/services/ai/insights.ts`) — A test simulating Redis unavailability during `runInsightAnalysis` should assert the process does not crash and that recipe generation continues normally. Currently the Redis client has no `.on('error')` listener and an unhandled error event would surface to the process-level `uncaughtException` handler.
## ISSUE:test 2026-06-24 09:03 → CookRecord flow, flow dietary cap bypass, and email re-verification are entirely untested; stemMatch substring false positives have no regression coverage

Zero test files remain (confirmed: no `*.spec.ts` / `*.test.ts` in tree; no test script in `package.json`). New untested paths not covered by prior entries:

1. **`POST /records/start` → complete/abandon flow** (`src/routes/cookRecords.ts`) — No test for the three-state lifecycle (STARTED → COMPLETED/ABANDONED). Specifically:
   - Multiple concurrent `POST /records/start` for the same `userId + recipeId` creates duplicate STARTED rows — no guard exists and no test catches it.
   - `servings` edge cases: `0`, negative, `undefined` — the `> 0` guard falls back to `recipe.servings`, but `recipe.servings` itself could be `0` if the DB row was migrated from before the default.
   - `stemMatch` false positive: `pluralStem("oil") = "oil"`, `pluralStem("foil") = "foi"` — the `includes` check (`as.includes(bs)`) would match `"oil"` against `"foil"` (`"foi".includes("oil")` is false, but `"oil".includes("foi")` is also false — actually this specific pair is safe). However `pluralStem("salt") = "sal"`, `pluralStem("salted") = "salted"` and `"salted".includes("sal")` = true — so "salt" would match "salted butter" correctly. Needs systematic table-driven tests.

2. **`POST /flows/:id/response` dietary filter cap bypass** (`src/routes/flows.ts:55-64`) — A flow step returning 4+ filters writes all to DB, bypassing the 3-filter cap. No test exercises this path. Integration test should: create a flow, submit response with 4 valid DietaryFilter values, assert `prisma.dietaryPreference.count` ≤ 3.

3. **`PATCH /users/me` email change** (`src/routes/users.ts:1695`) — No test verifies that changing email resets `emailVerified` to false (it currently does not). A test would expose the gap immediately: change email → fetch `/users/me` → assert `emailVerified: false`.

4. **`GET /insights`** — The five parallel `prisma.userInsight.findFirst` calls are not integration-tested. A test with two pending insights in the same category should confirm only the most recent is returned. The `status: "pending"` filter also needs a test confirming dismissed/accepted insights are excluded.
## ISSUE:test 2026-06-23 21:39 → Zero test files and no test runner configured; all critical paths are completely untested

The repo has no test framework and no test files. `package.json` contains no `jest`, `vitest`, or `mocha` dependency and no `test` script. No `.github/workflows/` CI file is present.

Highest-priority untested paths:
1. **OllamaProvider queue cascade** (`src/services/ai/ollama.ts:181`) — a test firing two concurrent `generateRecipe` calls where the first rejects would immediately expose the poison-queue bug
2. **Pantry cap enforcement** — the TOCTOU race in `src/routes/pantry.ts` requires concurrent integration tests against real Prisma to verify
3. **Rate-limit Lua script** — the atomic INCR+EXPIRE logic in `src/middleware/rateLimit.ts:117-122` can only be verified against a live Redis instance
4. **Auth flows** — register, login, Apple Sign In, Google OAuth callback, email verification, password reset have zero coverage
5. **Discover SQL** — the `$queryRaw` in `src/routes/recipes.ts:1351` has pantryPct/groceryPct arithmetic untested with zero-pantry, partial-pantry, and full-pantry inputs
6. **extractFoodEmoji** — 400+ keyword mappings in `src/services/ai/provider.ts:649` with ordering-sensitive last-position match logic have no regression tests
7. **pluralStem divergence** — the simpler stemmer in `src/routes/recipes.ts:963` vs the irregular-plural-aware version in `src/routes/cookRecords.ts` produce different results for the same inputs; no tests catch divergence
8. **Insight analysis thresholds** — `analyzeDietary` threshold of `max(2, floor(n * 0.3))` and the `MIN_RECIPES=5` guard in `src/services/ai/insights.ts` are behaviour-critical but entirely untested
## ISSUE:test 2026-06-23 11:23 → Zero test files, no test runner, no CI; rate limiting, auth, recipe fallback, and insights all untested

The repository has no test files, no testing framework in devDependencies (no jest/vitest/mocha/tap), and no `test` script in package.json. No `.github/workflows/` directory exists. Critical untested paths include:
- Rate limiting: Redis Lua INCR atomicity and per-role limit enforcement
- Apple Sign-In: JWKS key fetch, JWT verify, `kid` matching, cached keys TTL
- Google OAuth callback and token signing
- Recipe generation fallback: Claude failure → Ollama, dietary-filter silent drop behaviour
- `pluralStem` (two divergent implementations in cookRecords.ts and recipes.ts) and pantryUsed matching
- Insights analysis: all five category analyzers (dietary, cuisine, style, pantry, mealType), the Redis cooldown gate, and concurrent-save duplicate prevention
- Admin guard middleware (`requireAdmin`)
- Password reset and email verification token flows (expiry, deletion, re-use prevention)
- Discover feed raw SQL query correctness and pantry-match scoring
- OG image generation (napi-rs/canvas)

---
## ISSUE:test 2026-06-13 18:11 → Zero test files in the repo; no test runner configured; complex logic runs untested in production

The repository has no test files, no test runner (`jest`, `vitest`, `mocha`) in `package.json`, and no CI pipeline configuration. The `pluralStem` function handles 15 irregular plurals, an `ee` invariant, and three stripping rules — all are untested. The `extractFoodEmoji` 400+ line keyword table in `provider.ts` has no regression tests; a misplaced keyword (e.g. `"oil"` before `"foil"`) would silently produce wrong emojis for all affected recipes. The Apple JWT verification flow (JWKS fetch → key match → RS256 verify) has no integration test, so a key rotation by Apple could break all Apple Sign In silently until reported by a real user.
## ISSUE:test 2026-06-13 17:04 → Zero test files; pluralStem, extractFoodEmoji, and insight thresholds are highest-value targets

No test files exist anywhere in the repository. The `package.json` has no test runner dependency (no jest, vitest, or similar).

**Highest-value unit test targets:**

1. **`pluralStem` (two divergent versions)** — `src/routes/cookRecords.ts:1984` and `src/routes/recipes.ts:257`. Pure functions. Edge cases: `"cheese"` (invariant 'ee'), `"leaves"` (irregular), `"geese"` (irregular), `"tomatoes"` (oes rule), `"berries"` (ies rule), `"mushrooms"` ([^s]s rule).

2. **`extractFoodEmoji`** — `src/services/ai/provider.ts:732`. Pure function with 200+ keyword entries in `TITLE_KEYWORD_EMOJI`. Key cases: raw=`"🍽️"` (dishware, not in FOOD_DRINK_SET → keyword fallback), `"Lemon Cheesecake"` (should → `🍋` or `🍰`?), `"Chicken Mushroom Stir-fry"` (lastIndexOf: stir-fry wins).

3. **`runInsightAnalysis` threshold logic** — `src/services/ai/insights.ts:848-991`. The five analyzer functions (`analyzeDietary`, `analyzeCuisine`, `analyzeStyle`, `analyzePantry`, `analyzeMealType`) are pure modulo the Ollama suggestion call. Mock `ollamaSuggest` to test threshold boundary conditions without network calls.

4. **Rate-limit Lua script** — `src/middleware/rateLimit.ts:88-91`. The atomic INCR+EXPIRE script should be tested against a real Redis instance for concurrent-request race conditions.

5. **`pickRegion` continent filtering** — `src/services/ai/provider.ts:754`. Verify that passing `continentPreferences=['Asia']` restricts output to Asia-continent pairs only.
