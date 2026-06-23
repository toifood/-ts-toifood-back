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
