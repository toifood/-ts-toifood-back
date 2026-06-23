ASSET LOG - TEST
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:test {YYYY-MM-DD HH:MM} → {CONTENT}

CUSTOM PROMPT:
Existing test infrastructure, coverage breadth, CI test setup, test utilities

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:test 2026-06-24 10:24 → getAIProvider factory is the cleanest DI seam; email service is mockable with nodemailer stub; OllamaProvider queue is observable through fetch call counts; MAX_LISTS and flows handler are table-test ready

**No test infrastructure exists** (unchanged: no jest/vitest, no test script, no CI).

**New testable structure identified this pass:**

- **`getAIProvider()` factory** (`src/services/ai/index.ts`): a six-line `switch` on `process.env.AI_PROVIDER`. Tests can set `process.env.AI_PROVIDER = "claude"` before calling `getAIProvider()` and assert `result instanceof ClaudeProvider` without mocking any HTTP. The factory is also the ideal place to introduce a module-level singleton (`let instance: AIProvider | null = null`) to fix the queue-bypass bug — a test asserting `getAIProvider() === getAIProvider()` would both verify the fix and act as a regression guard.

- **`sendVerificationEmail` and `sendPasswordResetEmail`** (`src/services/email.ts`): both accept `(to: string, token: string)` with no shared state. Mocking `nodemailer.createTransport` with a `jest.fn()` spy returns a controllable `sendMail` stub. Tests can assert: correct `to` address, correct token embedded in the link, correct 24h vs. 1h expiry wording, and that the function rejects when `GMAIL_USER` is unset — covering the missing try/catch in `POST /auth/resend-verification` before the fix is applied.

- **`OllamaProvider.queue` serialization** (`src/services/ai/ollama.ts`): the queue property is `private` but the serialization invariant is observable through `fetch` call timing. A test that mocks `fetch` with a controlled promise (resolves only when manually triggered), fires two `generateRecipe` calls concurrently on the same `OllamaProvider` instance, and asserts that the second `fetch` is not called until the first resolves — verifies the queue invariant with no HTTP or Ollama dependency. The same test structure exposes the `getAIProvider()` per-call instantiation bug when run through the factory.

- **`MAX_LISTS` constant and TOCTOU shape** (`src/routes/lists.ts`): `MAX_LISTS = 5` is inlined with no configuration. The list-cap TOCTOU race (count-then-create, identical shape to pantry TOCTOU) is testable by firing six concurrent `POST /lists` requests against a real Prisma test database and asserting the final row count equals 5. The name-length gap requires only a single request with an oversized payload — lowest-setup boundary test in the lists module.

- **`POST /flows/:id/response` handler structure** (`src/routes/flows.ts`): the preferences step application (`deleteMany + createMany`) is entirely self-contained. A test using supertest + a Prisma test database can: seed a flow with `isActive: false`, call the endpoint, and assert zero writes to `DietaryPreference` — directly validating the inactive-flow guard without mocking any AI or email dependency. The `upsert` idempotency for `UserFlowView` is testable in the same fixture by calling the endpoint twice and asserting a single row.
## ASSET:test 2026-06-24 09:27 → analyzePantry is an extractable pure function; ollamaSuggest timeout is mockable; pluralStem IRREGULAR table is a complete unit-test input set; runInsightAnalysis Redis NX is independently verifiable

**No test infrastructure exists** (unchanged: no jest/vitest, no test script, no CI).

**New testable structure identified this pass (not covered by prior entries):**

- **`analyzePantry(recipes, pantryIngredients)`** (`src/services/ai/insights.ts`): takes two plain arrays and returns `InsightCandidate | null`. The function's only external dependency is `ollamaSuggest`, which can be replaced with a stub returning the `fallback` string by intercepting `fetch`. Table-driven tests can then assert exact `missing` arrays for given recipe/pantry combinations — directly validating the `Set.has` vs. `stemMatch` discrepancy without any DB setup.

- **`ollamaSuggest` 8-second AbortController timeout**: the timeout path is independently testable by mocking `fetch` with a `Promise` that resolves after 9 seconds. A test can assert the function returns the `fallback` string rather than hanging — this is the highest-value timeout unit test in the service layer, requiring no Ollama instance.

- **`pluralStem` IRREGULAR table** (`src/routes/cookRecords.ts`): the 16 irregular entries (`leaves→leaf`, `knives→knife`, `children→child`, etc.) form a complete expected-output table with zero setup. A 16-case unit test plus spot-checks for the `ee$` guard (`cheese`, `coffee`, `toffee`), the `oes$` rule (`tomatoes→tomato`), and the `ies$` rule (`berries→berry`) covers the full `pluralStem` function in under 40 lines. This is the second highest-signal/lowest-setup unit test target after `stemMatch` (noted in 2026-06-24 09:03 entry).

- **`runInsightAnalysis` Redis NX cooldown** (`src/services/ai/insights.ts`): the cooldown key is `insights:cooldown:${userId}`. A test using `ioredis-mock` (or a real Redis instance) can set this key before calling `runInsightAnalysis` and assert zero `prisma.userInsight.create` calls occur — verifying the early-return path independently of the analyzer logic.

- **`Promise.allSettled` analyzer isolation**: since each of the five analyzers (`analyzeDietary`, `analyzeCuisine`, `analyzeStyle`, `analyzePantry`, `analyzeMealType`) is a standalone async function with no shared mutable state, each can be unit-tested in isolation with stub data. A failing `analyzeCuisine` stub can be combined with passing stubs for the other four to verify that `runInsightAnalysis` still writes insights for the passing analyzers — confirming the `allSettled` isolation guarantee.
## ASSET:test 2026-06-24 09:03 → CookRecord snapshot design and stemMatch interface are immediately unit-testable; shared enum exports anchor contract tests

**No test infrastructure exists** (unchanged from prior entries: no jest/vitest, no test script, no CI).

**New testable structure identified this pass:**

- **`CookRecord` JSON snapshot fields** (`prisma/schema.prisma` CookRecord model): `ingredients`, `pantryItems`, and `groceryItems` are stored as `Json` snapshots at cook-start time. This makes `POST /records/start` integration tests deterministic — the expected pantry/grocery split can be asserted directly on the created record without needing to re-query pantry state after the fact.

- **`stemMatch(a, b): boolean`** (`src/routes/cookRecords.ts`): a two-argument pure boolean function with no imports or side effects. Table-driven unit tests can verify the `pluralStem` IRREGULAR table, the `ee$` invariant guard, and the `includes` substring logic in under 30 lines. This is the highest-signal/lowest-setup unit test target in the codebase — it also directly validates pantry matching correctness for the cook-record flow.

- **`CATEGORIES` const** (`src/routes/insights.ts:9`): `["dietary", "cuisine", "style", "pantry", "mealType"]` — a test can import this array and assert `runInsightAnalysis` produces at most one pending insight per category, ensuring the `findFirst + create/update` logic is covered for the concurrent-create race.

- **`shared/src/index.ts` enum exports** (`DietaryFilter`, `RecipeStyle`): importable in tests without any mocking or DB setup. Flow-response tests can use `Object.values(DietaryFilter).slice(0, 4)` to construct an over-limit filter payload without hardcoding strings, making the cap-bypass test resilient to enum changes.

- **`AIProvider` interface** (`src/services/ai/provider.ts:641`): a one-method interface (`generateRecipe`) that can be stub-implemented in tests to verify fallback logic in `POST /recipes/generate` without starting Ollama or incurring Claude API calls.
## ASSET:test 2026-06-23 21:39 → No test infrastructure exists; codebase is architecturally well-suited for testing

**Current state:**
- No test framework in `package.json` (no `jest`, `vitest`, `mocha`, `tap`, etc.)
- No `test` script in `package.json`
- No test files in the repository (tree scan confirmed — `*.spec.ts`/`*.test.ts` filter returned nothing)
- No CI pipeline visible (no `.github/workflows/` directory)

**What makes the codebase testable when a framework is added:**
- Express routes use `Router` — mountable in `supertest` without starting a real server
- Prisma singleton in `src/lib/prisma.ts` — swappable with `jest.mock` or `prisma-mock`
- Redis accessed via module-level singletons in `rateLimit.ts` and `insights.ts` — mockable with `ioredis-mock`
- AI providers implement the `AIProvider` interface (`src/services/ai/provider.ts:641`) — easily stubbed for unit tests
- Pure utility functions with no side effects: `extractFoodEmoji`, `inferEmojiFromTitle`, `pluralStem`, `buildStyleInstruction`, `avg`, `buildRecipeStats` — immediately unit-testable with no setup
- `shared/src/index.ts` exports `DietaryFilter` and `RecipeStyle` enums importable in tests without any mocking
## ASSET:test 2026-06-23 11:23 → No testing framework, no test scripts, no CI config — test infrastructure is at zero

- `package.json` scripts: `dev`, `build`, `start` only — no `test` script
- devDependencies: nodemon, ts-node, tsconfig-paths, typescript — no testing library present
- Test files: none (`.spec.ts` and `.test.ts` patterns excluded from tree; none appear in full file listing)
- CI: no `.github/workflows/` directory in repository tree
- No test fixtures, factories, seed helpers, or mock utilities
- `shared/src/index.ts` exports type contracts (`DietaryFilter`, `RecipeStyle`, `GenerateRecipeRequest`) that could anchor contract tests
- `src/middleware/rateLimit.ts` Redis Lua eval would benefit most from unit testing (complex atomic logic)
- Recommended starting stack: Vitest (zero-config TS) + supertest (route integration) + testcontainers-pg (real DB isolation) + ioredis-mock (Redis unit tests)

---
## ASSET:test 2026-06-13 18:11 → TypeScript compilation and shared typed contracts provide a minimal static verification boundary

`npm run build` (TypeScript compilation) acts as a type-check gate and catches type-level regressions across the entire codebase before deploy. The `shared/` package enforces typed request/response contracts (`GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle`) between frontend and backend at compile time — a contract break fails the build on both sides. The Prisma schema provides a DB-level correctness constraint that `prisma migrate deploy` validates against the live database on each deploy. `tsconfig-paths/register` in the dev startup ensures path aliases resolve correctly at runtime, catching misconfigured imports before they reach production.
## ASSET:test 2026-06-13 17:04 → Testable pure functions with signatures and known edge cases

**`pluralStem(s: string): string`**
- Correct (full): `src/routes/cookRecords.ts:1984-2002`
- Buggy (simple): `src/routes/recipes.ts:257-262`
- Known edge: `pluralStem("cheese")` → `"cheese"` (correct) vs `"chees"` (buggy simple version)

**`extractFoodEmoji(raw, title, pantryUsed, ingredients): string`**
- `src/services/ai/provider.ts:732`
- Inputs: raw emoji string, title string, string[], string[]
- Gate: `FOOD_DRINK_SET` at line 695 — dishware (🍽️ 🍴 🔪) NOT in set
- Fallback chain: FOOD_DRINK_SET check → `inferEmojiFromTitle` → `inferEmojiFromIngredients` → `"🍽️"`

**`inferEmojiFromTitle(title: string): string | null`**
- `src/services/ai/provider.ts:713` — uses `lastIndexOf` (last keyword position wins)
- 200+ entries in `TITLE_KEYWORD_EMOJI` array at line 468

**`pickRegion(continentPreferences?: string[]): [string, string]`**
- `src/services/ai/provider.ts:754` — uses `Math.random()`; mockable with `jest.spyOn`

**`buildStyleInstruction`, `buildPantryLine`, `buildMealTypeLine`**
- `src/services/ai/provider.ts:762-776` — pure string builders, snapshot-testable

**`analyzeDietary`, `analyzeCuisine`, `analyzeStyle`, `analyzePantry`, `analyzeMealType`**
- `src/services/ai/insights.ts:848-991` — async but pure modulo `ollamaSuggest`; mock `ollamaSuggest` to test threshold logic

**No test runner installed:** add `vitest` or `jest` + `ts-jest` to `devDependencies`
