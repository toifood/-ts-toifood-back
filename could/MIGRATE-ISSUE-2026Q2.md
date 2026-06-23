ISSUE LOG - MIGRATE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:migrate {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Breaking schema changes, missing rollback, data loss risk

PATHS:
prisma/
####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:back 2026-06-23 15:14 → Schema migration history and two upcoming migration needs

**Recent migration history** (prisma/migrations/)
- `20260330` — init (full schema)
- `20260331` — add defaultServings
- `20260401` — email verification + password reset tokens
- `20260403` — pantry items; is_premium flag
- `20260406` — recipe style field
- `20260409` — emoji on Recipe
- `20260410` — provider/style/mealType/pantryUsed on Recipe
- `20260411` — cookTime (int)
- `20260413` — Apple ID
- `20260414` — remove favourite table
- `20260415` — Flow system (Flow, UserFlowView); is_admin flag; adminOnly on Flow
- `20260417` — recipe match data added then removed; SavedList
- `20260420` — continent on Recipe
- `20260505` — continentPreferences on User
- `20260530` — updatedAt on Flow; FlowStep table dropped
- `20260531` — CookRecord model; ageRange + gender on User
- `20260614` — UserInsight: removed unique constraint, added updatedAt + resolvedAt (history tracking)

**Upcoming migration needs identified from code review**

1. **ogImage Bytes → external URL**: `Recipe.ogImage` stores PNG data as `Bytes` directly in PostgreSQL. As the recipe count grows this will significantly inflate DB size. Recommended: migrate to R2/S3, store a URL string instead. Requires backfilling existing images.

2. **SavedList MAX_LISTS DB constraint**: The 5-list cap is enforced only in application code (`src/routes/lists.ts:557`). A direct DB write bypasses it. Add a DB-level check or a trigger to enforce `COUNT(*) <= 5` per user.

---
## ISSUE:backend 2026-06-23 14:32 -> Migration 20260614 drops UserInsight unique constraint — restore SQL must not recreate it; RecipeReview/SavedList still untracked

**`20260614000000_insights_drop_unique_add_history` — most recent tracked migration**
This migration intentionally removes the `@@unique([userId, category])` constraint from `UserInsight` and replaces it with `@@index([userId, category])`, enabling accumulation of insight history (multiple rows per user+category). Any restore procedure or recovery SQL that recreates `CREATE UNIQUE INDEX "UserInsight_userId_category_key"` will either fail (if history rows exist) or silently re-impose uniqueness that breaks the insight history pattern.

**Still untracked via Prisma migration files (raw SQL required):**
- `RecipeReview` — no migration file; table must be created via raw SQL on restore
- `SavedList` — no migration file
- `SavedListItem` — no migration file

**Tracked via Prisma migrations (deploy covers these):**
- `CookRecord`, `CookStatus` enum — covered by `20260531000000_add_cook_record`
- `UserInsight` with non-unique index — covered by `20260614000000`
- `User.ageRange`, `User.gender` — covered by `20260531000001_add_user_age_gender`
## ISSUE:migrate 2026-06-23 11:23 → Three destructive migrations with no rollback; UserInsight race on concurrent saves; dump.rdb in repo

1. `prisma/migrations/20260414000000_remove_favourite_table/`: drops a table permanently — data unrecoverable with no down migration.
2. `prisma/migrations/20260417014518_remove_recipe_match_columns/`: removes columns from Recipe — data permanently deleted; no rollback path.
3. `prisma/migrations/20260530000000_add_updated_at_drop_flowstep/`: drops FlowStep (if it existed). If applied to an environment that has not been properly backed up, step data is unrecoverable.
4. `UserInsight` model has `@@index([userId, category])` but no `@@unique([userId, category, status])` constraint. The insights.ts `findFirst + update/create` upsert pattern is not atomic — concurrent recipe saves for the same user within the same second can both pass `findFirst` returning null and both `create`, producing duplicate pending insights per category.
5. `dump.rdb` committed to the repository root — a Redis RDB snapshot that could contain production keys, rate-limit state, or cooldown tokens. Should be gitignored.

---
## ISSUE:backend 2026-06-22 20:06 -> Three migration candidates — CSV metrics to PostgreSQL, OG images to object storage, auth GitHub sync to DB writes

**1. Recipe/discover/auth/digest metrics from local CSV to a PostgreSQL event table**
`RECIPE-METRIC.csv`, `DISCOVER-METRIC.csv`, `AUTH-METRIC.csv`, and `DIGEST-METRIC.csv` are appended to disk on the Mac Mini. They are: not queryable without SSH, lost if the disk is reformatted, and incompatible with multi-instance deployment. A `RecipeEvent` model with columns mirroring the CSV header would make metrics queryable in Prisma, retained in pg_dump, and immediately compatible with the existing Prisma connection. The write functions in `recipes.ts` and `auth.ts` are already centralised — the migration surface is small.

**2. `Recipe.ogImage Bytes?` from PostgreSQL BYTEA to object storage URL**
Each shared recipe stores a ~150–400KB PNG directly in the `ogImage` column. The serving route (`GET /recipes/public/:token/og-image`) reads and streams `recipe.ogImage`. Switching to an S3/R2 URL only requires changing what the column stores and what the route returns — the placeholder fallback at `src/routes/recipes.ts:904` handles missing images already. A one-time backfill job would upload existing BLOBs and write URLs back.

**3. `pushRowToGitHub` auth metric sync replaced by direct PostgreSQL insert**
`src/routes/auth.ts:958-1003` appends auth event rows to `toifood-dev/ts-toifood-dev` via GitHub Contents API on every non-local auth event, with one retry on 409. This places a GitHub API call on the hot login/register path. A GitHub rate-limit or timeout silently swallows the event. Storing auth events in a `AuthEvent` table removes the external dependency and the retry logic.
## ISSUE:migrate 2026-06-22 11:51 → DietaryPreference table should migrate to String[] on User; storeReport.ts targets legacy archive path

**Migration 1 — DietaryPreference → User.dietaryPreferences String[]**: The `DietaryPreference` model is a join table with no extra relations (just `userId + filter + timestamps`). `continentPreferences` was already migrated to a `String[]` column on `User`. Consolidating dietary preferences the same way would eliminate 3–5 extra queries per request (deleteMany + createMany on every preference save) and simplify all read paths from `include: { preferences: true }` to a simple column select.

**Migration 2 — Legacy route prefix retirement**: The dual `/` and `/1-1-1/` route registration in `src/index.ts` doubles the Express route table. A migration plan with a concrete deprecation date tied to minimum app version (`MIN_APP_VERSION`) would allow removing the legacy block once old builds are below a threshold share.

**Migration 3 — storeReport.ts archive path**: `src/storeReport.ts` writes to `-ARCHIVE/-WOULD/usage-issue-v1.md` and `-ARCHIVE/-WOULD/usage-asset-v1.md` — a path pattern that doesn't match the current `could/` convention used everywhere else. This script either needs migration to write to `could/USAGE-ISSUE-2026Q2.md` / `could/USAGE-ASSET-2026Q2.md`, or it's dead code.

**Migration 4 — Insights to async queue**: The weekly per-user insight analysis fires 5 Ollama calls synchronously in `Promise.allSettled` after every recipe save. As users grow, this creates concurrent Ollama load spikes. Migrating to a Redis-backed task queue (BullMQ) would spread the load and decouple generation latency from the save response.
## ISSUE:backend 2026-06-22 11:03 → One migration since last entry: UserInsight unique constraint dropped; no new models or columns

Since the 2026-06-13 entry, one migration has landed:

**`20260614000000_insights_drop_unique_add_history`** — Drops `@@unique([userId, category])` from `UserInsight` and replaces it with `@@index([userId, category])`. The schema in `prisma/schema.prisma` now shows only the index. The `runInsightAnalysis` function in `src/services/ai/insights.ts` was updated in the same change: it now manually queries for an existing pending insight per category and calls `update` if found, `create` if not — replacing what was previously enforced by the DB unique constraint.

**Risk**: Any restore that applies the old schema (with the unique constraint) would fail to insert a second insight for the same category when the unique constraint is present. The migration correctly removes it. Restore checklist should confirm that `UserInsight` does NOT have a unique constraint on `(userId, category)` after restore.

**No new models** since 2026-06-13. No new columns on existing models. The schema in this state has these models: `User`, `Recipe`, `RecipeReview`, `SavedList`, `SavedListItem`, `DietaryPreference`, `PantryItem`, `Flow`, `UserFlowView`, `UserInsight`, `CookRecord`, `PasswordResetToken`, `EmailVerificationToken`. Enums: `UserRole` (free/premium/admin), `FlowTrigger` (first_login/manual), `CookStatus` (STARTED/COMPLETED/ABANDONED).
## ISSUE:migrate 2026-06-13 18:11 → No rollback scripts; destructive drops in recent migrations risk data loss

Three migrations have dropped data irreversibly: `20260414_remove_favourite_table`, `20260417014518_remove_recipe_match_columns`, and `20260530_add_updated_at_drop_flowstep`. None have corresponding rollback SQL. Prisma does not generate down migrations, and no manual rollback scripts exist in the repo. The `CookRecord` model stores `ingredients`, `pantryItems`, and `groceryItems` as unvalidated `Json` columns — a silent application-layer schema change (e.g. renaming a key) would corrupt stored records without a migration. No seed scripts exist, so a fresh database after a failed migration leaves the app in an indeterminate state with no recovery path.
## ISSUE:migrate 2026-06-13 17:04 → Flat CSV metrics, in-memory Ollama queue, and DietaryPreference denormalization are migration candidates

**1. CSV → DB metrics.** Recipe, discover, and digest metrics are appended to flat files (`logs/RECIPE-METRIC.csv`, `logs/DISCOVER-METRIC.csv`, `logs/DIGEST-METRIC.csv`) via synchronous `fs.appendFileSync` calls in `src/routes/recipes.ts:140-158` and `src/digest.ts:68-85`. This blocks the event loop on each write and makes historical SQL aggregation impossible. A `Metric` table in Postgres would unify the data store.

**2. In-memory Ollama serial queue.** `OllamaProvider` in `src/services/ai/ollama.ts:173` chains all requests onto `this.queue = this.queue.then(...)` to prevent Ollama context-window thrash on the Mac mini. This queue is lost on every PM2 restart, making queue depth invisible to monitoring. A Redis-backed queue or documented restart policy would make this recoverable.

**3. DietaryPreference denormalization.** Dietary tags live in two places: the normalized `DietaryPreference` table (per-user preferences) and `dietaryTags: String[]` on Recipe. The recipe column is only populated for Claude-generated recipes (`src/routes/recipes.ts:324` — `usedProvider === 'claude' ? validFilters : []`). Ollama recipes always store `[]`. This split is undocumented and makes tag-based discover filtering inconsistent.
## ISSUE:migrate 2026-06-09 18:16 â†’ JSON column format versioning absent across four models; profileVisibility and FlowStep.content have no schema enforcement; onboarding response data locked in unqueryable JSON blobs

**Unversioned JSON shapes in four models:**
- `FlowStep.content` (JSON) â€” stores onboarding step configuration including type-specific fields (preferences step vs. tip step). If the flow editor changes the content schema (new keys, renamed keys), existing `UserFlowView.responses` rows hold data in the old format. There is no migration script, version field, or discriminator to distinguish old vs. new response shapes. Parsing logic that expects the new shape will produce silent `undefined` on old rows.
- `UserFlowView.responses` (JSON) â€” captures per-step user responses keyed to step order or step ID. Any change to step numbering or ID scheme in `FlowStep` invalidates historical response keys with no detectable error.
- `User.profileVisibility` (JSON) â€” stores display preference flags with no Prisma validator or Zod schema. Unknown keys silently persist and stale keys silently remain after a feature removal.
- `Recipe.ogImage` (Bytes) â€” not a JSON column but has the same unbounded growth problem: no row-level size cap, no S3 archival trigger, and no migration to move existing blobs out of PostgreSQL into object storage.

**No JSON migration strategy:**
- Prisma has no native `jsonb_set` migration helper. Format changes require a standalone data migration script that must be written, tested, and run manually â€” none is present in the repo for any of these columns.
- Recommendation: Add a `schemaVersion` field to `FlowStep.content` and `UserFlowView.responses`, and validate shape at read time with a Zod parser that returns a typed default for unknown versions.

## ISSUE:migrate 2026-06-09 18:03 â†’ Concurrent recipe saves can trigger parallel UserInsight upserts; no retry on P2002 collision; manual cascade gaps accumulate with each new delete path

**Concurrent upsert race on UserInsight:**
- `runInsightAnalysis()` is called during recipe save flow. If two recipe saves complete simultaneously for the same user (e.g., batch import or retry), two parallel calls attempt `prisma.userInsight.upsert` on `@@unique([userId, category])`. Under Prisma with PostgreSQL, concurrent upserts on the same unique key can both reach the INSERT path before either updates â€” only one succeeds; the other throws P2002. There is no retry handler or idempotency guard in the insight service.

**Insight analysis scope on every recipe save:**
- `runInsightAnalysis()` generates insights across ALL categories (not just the category of the new recipe). On each recipe save, this means one AI call per insight category per user. For a user with 5 active insight categories, saving a recipe fires 5 AI calls â€” all trying to upsert into the same `@@unique([userId, category])` table simultaneously.

**Growing manual cascade gap:**
- As new models are added (CookRecord, UserInsight), the pattern of manually deleting some models in `DELETE /users/me` and relying on schema cascade for others is diverging. Currently `PasswordResetToken` and `EmailVerificationToken` are manually deleted; if a future developer adds a new model with `onDelete: Restrict` by mistake, user deletion silently fails with FK error. No schema audit step exists in the delete route.

**Action needed:** Wrap insight upserts in a try/catch with P2002 retry or use a queued job. Audit all models for cascade vs. manual delete consistency and document the decision per-model.
## ISSUE:migrate 2026-06-07 16:30 â†’ CookRecord and UserInsight models added in 1-1-1 with no documented migration path; ogImage Bytes column growing unbounded

**New models since last analysis (1-1-1 branch):**
- `CookRecord` â€” tracks cook session lifecycle (STARTED/COMPLETED/ABANDONED), stores `ingredients`, `pantryItems`, `groceryItems` as JSON blobs, plus `pantryCount`/`groceryCount` counters
- `UserInsight` â€” AI-generated per-category suggestions with `@@unique([userId, category])` constraint meaning only one pending insight per category per user at a time
- `RecipeReview` â€” star rating model with `@@unique([userId, recipeId])`

**Migration risks:**
- `ogImage Bytes` column on Recipe has no size cap â€” as recipe count grows, PostgreSQL table bloat will increase significantly. No archival strategy exists.
- `UserInsight.data` and `CookRecord.ingredients/pantryItems/groceryItems` are all raw `Json` columns with no schema enforcement â€” any structural change to AI output or ingredient format silently passes.
- `@@unique([userId, category])` on UserInsight means upsert collisions will silently overwrite insight data if Prisma uses `upsert` in insights service â€” verify this is intentional.
- `DietaryPreference` lacks cascade delete from User in schema â€” manual deletion required in `DELETE /users/me` route (and currently is done manually, but if a new delete path is added without mirroring, orphans will accumulate).
## ISSUE:migrate 2026-06-07 10:00 â†’ Schema far ahead of README docs; appleId, role enum, ogImage, shareToken, and 8 undocumented models added

Prisma schema has grown significantly beyond what README describes. The following are present in schema but undocumented:

**Undocumented models:** `RecipeReview`, `SavedList`, `SavedListItem`, `PantryItem`, `Flow`, `FlowStep`, `UserFlowView`, `PasswordResetToken`, `EmailVerificationToken`

**Undocumented User fields:** `appleId` (Apple Sign-In), `role` (UserRole enum: free/premium/admin), `defaultServings`, `recipeStyle`, `continentPreferences`, `profileVisibility` (JSON), `emailVerified`

**Undocumented Recipe fields:** `shareToken` (unique, OG sharing), `ogImage` (Bytes, canvas-generated), `videoId` (YouTube), `continent`, `pantryUsed`, `provider`, `recipeStyle`, `emoji`, `mealType`, `cookTime`

**Risk:** No migration history visible in repo â€” only `schema.prisma`. Anyone running `prisma migrate deploy` in a fresh environment has no audit trail of how schema evolved. `profileVisibility` stored as raw JSON with no type enforcement; `ogImage` as Bytes will grow large in PostgreSQL over time.

**Action needed:** Run `prisma migrate status` to verify migration history exists on the Mac mini. Document all schema additions in README. Consider archiving `ogImage` blobs to object storage rather than DB columns.
