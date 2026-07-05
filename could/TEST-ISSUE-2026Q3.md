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
## ISSUE:test 2026-07-06 07:08 → No round-trip test for the metrics CSV format, no regression tests for the PATCH /users/me and pantry type-confusion bug class, and duplicated stemming logic drifts untested

**CSV writer/reader round-trip is unpinned.** `appendMetric` (`src/routes/recipes.ts`) quotes and escapes the title column, but its consumers — `readTodayRecipes` in `src/digest.ts` and the line-counters in `src/slack-bot.ts` / `src/routes/chat.ts` — parse with a naive `split(",")` / `startsWith(today)`. A quoted title containing a comma already misaligns the parsed record, and any new column inserted before `title` breaks every reader silently (digest stats would attribute wrong values with no error). One unit test writing a row via the writer and parsing it via the reader would pin the contract; today nothing does.

**The two live bug classes in mutation routes have no regression tests.** Nothing asserts that `PATCH /users/me` with a changed email resets `emailVerified` (it doesn't — current bug) or normalizes case; nothing sends a non-string `ingredient` to `POST /pantry` (currently throws before the type guard and hangs the request); nothing exercises `PATCH /users/me/preferences` failure between its `deleteMany` and `createMany` (preference wipe). These are cheap supertest cases against the existing Postgres-backed harness and would have caught all three.

**Stemming logic exists twice with zero tests on either.** `src/routes/cookRecords.ts` has the careful `pluralStem` (irregulars, `oes`/`ies` rules, `ss` guard) while `src/routes/recipes.ts` inlines a naive three-`replace` version — so pantry matching at generation time and at cook-start time can disagree for the same recipe. The shared `stemMatch` substring check also has known false positives (`"ice"` matches `"rice"`, `"ham"` matches `"graham cracker"`). Characterization tests over a fixture list of ingredient pairs would both document current behavior and force convergence on one implementation.

**Silent-failure paths in async side effects are untested.** No test covers `runInsightAnalysis` consuming the weekly Redis cooldown when analysis fails (`src/services/ai/insights.ts`), and none covers the og-image placeholder race where `GET /recipes/public/:token/og-image` serves a 0-byte PNG with a 24h public cache header before `initPlaceholder()` resolves (`src/routes/recipes.ts`).

**Cleanup helper relies on an implicit schema property.** `src/__tests__/helpers/db.ts` truncates 10 models but never `recipeReview` — it only works because `RecipeReview` has `onDelete: Cascade` from both `User` and `Recipe`. If that cascade is ever removed in `prisma/schema.prisma`, the whole suite starts failing in `beforeEach` with an FK error far from the change. An explicit `prisma.recipeReview.deleteMany()` line makes the helper self-sufficient.
## ISSUE:test 2026-07-05 07:03 → Test suite covers user-facing CRUD routes but nothing touching Redis, AI providers, or ops tooling

Existing coverage (`src/__tests__/*.test.ts`): `auth`, `cookRecords`, `insights`, `lists`, `pantry`, `recipes`, `users` — all backed by the real Postgres test DB via `vitest.config.ts` (`fileParallelism: false`, `setupFiles: ["./src/__tests__/helpers/db.ts"]`).

**Untested surface with real risk:**

- **`src/middleware/rateLimit.ts`** — the daily free/premium/admin recipe-generation caps are the product's monetization gate. The atomic Lua `INCR`+`EXPIRE` (`rateLimit.ts:80-85`), the admin bypass (`rateLimit.ts:75`), and the "Redis unavailable → skip limiting" fallback (`rateLimit.ts:98-100`) have zero test coverage despite `vitest.config.ts` already wiring a real `REDIS_URL` for the test env — a regression here silently removes revenue gating or blocks paying users.
- **`src/services/ai/provider.ts`** — `pluralStem`/emoji-inference logic (`extractFoodEmoji`, `inferEmojiFromTitle`, `pickRegion`) is pure and easily unit-testable, but has no tests; the `TITLE_KEYWORD_EMOJI` ordering comment ("most-specific first") is a correctness invariant (`lastIndexOf`-based scoring in `provider.ts:338-345`) that's easy to silently break when new keywords are appended.
- **`src/routes/chat.ts`, `src/routes/admin.ts`, `src/routes/storeMetrics.ts`** — no tests; `storeMetrics.ts` is the one route that layers `requireAuth` + `requireAdmin`, and there's no regression test asserting a non-admin gets 403 there.
- **`src/services/appstore.ts`, `playstore.ts`, `youtube.ts`, `email.ts`** — all external-API integrations with no tests exercising their timeout/failure fallback paths (e.g. `youtube.ts`'s 5s `AbortController` timeout, `provider.ts`'s Claude→Ollama fallback in `src/routes/recipes.ts:230-247`).
- **`src/digest.ts`, `src/storeReport.ts`, `src/slack-bot.ts`** — standalone scripts, entirely untested.
## ISSUE:test 2026-07-04 07:06 → CRUD happy paths covered but auth flows, AI generation, discover SQL, and share endpoints are untested; auth suite sits near the rate-limit cliff

**Untested surface (highest value first)**
- `POST /recipes/generate` — the core product path: rate-limit middleware (role tiers, Lua INCR), Claude→Ollama fallback, pantry-match derivation, metric writes. Zero tests; a regression here ships blind.
- Auth flows beyond register/login: `/auth/apple` (JWKS verify), Google callback, `forgot-password`/`reset-password`/`reset-password-form` (token expiry, single-use), `verify-email`, `resend-verification`. Token-expiry edge cases are one `Date` comparison away from a security bug.
- `GET /recipes/discover` — the largest raw-SQL query in the codebase (CTE + LATERAL join + visibility masking); schema renames won't be caught by the type checker.
- Share lifecycle: `POST/DELETE /:id/share`, `GET /public/:token`, og-image serving.
- `users.ts`: PATCH `/me` (password change, email conflict), `/me/privacy`, `DELETE /me` (manual FK-order deletes), public `/users/:id/profile` visibility masking.
- Also untested: `records/:id/abandon`, note PATCHes, reviews, `storeMetrics`, `chat` route, `runInsightAnalysis` analyzer logic, `extractFoodEmoji`/`pluralStem` (pure functions, cheapest wins available).

**Flakiness risks**
- `auth.test.ts` sends ~7 register/login POSTs against `authLimiter` (10 per 15min, in-process). Two more auth tests will start intermittently returning 429 — the failure will look unrelated to the change that triggers it.
- Suite requires live Postgres **and** Redis (`REDIS_URL` pinned); with Redis absent, rate-limit code fails open so tests pass, but `insights` cooldown paths would behave differently — environment-dependent behavior.

**No CI** — no `.github/workflows` in the tree; `npm test` runs only when someone remembers. No coverage reporting or threshold exists.
