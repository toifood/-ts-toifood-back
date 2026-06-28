SHOULD ASSET LOG
prompt: review and update migration plans, version upgrades, breaking changes, deprecation paths, schema changes
path: should/MIGRATE-ASSET-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:MIGRATE {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:MIGRATE 2026-06-28 18:28 ▸ Linear Prisma migration history complete through 20260614; CookRecord and UserInsight history model represent mature data capture
## ASSET:MIGRATE 2026-06-29 06:28 ▸ runInsightAnalysis correctly implements update-in-place for pending rows; 7-day Redis cooldown and dismissed-category filter prevent analysis churn

**Update-in-place correctness**: `runInsightAnalysis` in `src/services/ai/insights.ts` explicitly handles the post-20260614 schema: if a `pending` insight for a category already exists, it updates the existing row (`suggestion`, `data`) rather than creating a duplicate. New rows are created only when no pending insight is present. This correctly handles the history model without creating unbounded pending stacks.

**7-day Redis cooldown**: `insights:cooldown:{userId}` key is set with `NX` (only if not exists) and a 7-day TTL. This prevents `runInsightAnalysis` from being triggered more than once per week per user regardless of how many recipe generations occur. The cooldown is per-user rather than global, ensuring high-volume users don't suppress insights for others.

**Dismissed-category filter**: Recent dismissed insights (within 7 days) are excluded from analysis via `resolvedAt >= sevenDaysAgo`. This filter operates at the category level, so dismissing a `pantry` insight suppresses pantry analysis for a week without affecting other categories.

**Schema stability**: No migration has been applied since `20260614`. `CookRecord`, `UserInsight`, and the full `User` model (including `ageRange`, `gender`, `continentPreferences`) are stable and fully utilised by current route and service code.

**Linear migration history**: All 22 migrations from `20260330_init` through `20260614_insights_drop_unique_add_history` are sequential with no gaps, applied in timestamp order. `prisma/migrations/migration_lock.toml` is present, locking the provider to `postgresql` and preventing accidental provider drift.

**CookRecord model** (added `20260531`): Captures a snapshot of `ingredients`, `pantryItems`, `groceryItems` as JSONB alongside counts, enabling historical analysis of pantry utilisation per cook session. `CookStatus` enum (STARTED / COMPLETED / ABANDONED) supports funnel analytics. Foreign keys cascade on user/recipe delete.

**UserInsight history model** (evolved `20260614`): Dropping the unique constraint on `(userId, category)` and replacing with a non-unique index converts insights from a single-slot-per-category design to an accumulating history. `src/routes/insights.ts` correctly surfaces the latest `pending` insight via `findFirst(orderBy: createdAt desc)`. The index `UserInsight_userId_category_idx` ensures this query remains performant as history grows.

**Continent preference schema** (`20260505`): `User.continentPreferences String[]` paired with `Recipe.continent String?` (added `20260420`) creates a complete preference-to-generation feedback loop. `src/services/ai/provider.ts` `pickRegion()` filters `COUNTRY_REGIONS` by user continent preferences at generation time.

**Age/gender fields** (`20260531`): `User.ageRange String?` and `User.gender String?` added alongside `preferencesUpdatedAt DateTime?` — structured for personalisation analytics without PII normalisation into separate tables.
