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
