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
