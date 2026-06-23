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
