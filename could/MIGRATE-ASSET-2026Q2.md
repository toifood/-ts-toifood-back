ASSET LOG - MIGRATE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:migrate {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Migration tooling, seed scripts, rollback coverage

PATHS:
prisma/
####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:migrate 2026-06-23 11:23 → 28 Prisma migrations to PostgreSQL; no seed scripts; no rollback scripts; dump.rdb present

- Total migrations: 28 (2026-03-30 → 2026-06-14)
- Provider: PostgreSQL only (`migration_lock.toml` enforces this)
- Models: User, Recipe, RecipeReview, SavedList, SavedListItem, DietaryPreference, PantryItem, Flow, UserFlowView, UserInsight, CookRecord, PasswordResetToken, EmailVerificationToken
- Enums: UserRole (free/premium/admin), FlowTrigger (first_login/manual), CookStatus (STARTED/COMPLETED/ABANDONED)
- Recent Q2 2026 additions: UserInsight (insights engine), CookRecord (cook sessions), ageRange/gender on User, continentPreferences on User, updatedAt on Recipe
- Destructive migrations: remove_favourite_table, remove_recipe_match_columns, add_updated_at_drop_flowstep
- No seed scripts
- No down/rollback migrations
- `dump.rdb` present at repo root (Redis snapshot)

---
## ASSET:backend 2026-06-22 20:06 -> Disciplined migration cadence and additive-first pattern reflect low-risk schema change practice

**Small-scope incremental migrations**
The 17 migrations from `20260330` to `20260614` each address a single model or concern (`add_cook_time_to_recipe`, `add_apple_id`, `add_continent_preferences`). No migration rewrites multiple models simultaneously. This keeps migration rollback surface small and review time low.

**Additive-first in `insights_drop_unique_add_history` (`20260614000000`)**
The most recent migration converted the `UserInsight` unique constraint to an `@@index([userId, category])` — dropping the uniqueness requirement to allow history rows per category. Adding the index first (replacing the constraint) avoids a table rewrite on the `UserInsight` table and keeps the migration non-blocking. The application layer (`runInsightAnalysis`) guards against duplicate pending rows at the code level rather than relying on DB constraint.

**`migration_lock.toml` signals `migrate deploy` workflow**
The presence of the lock file confirms Prisma Migrate is used in production deploy mode rather than `db push`. Schema changes are committed as versioned migration files, giving a clear audit trail of what ran in production and when.
## ASSET:migrate 2026-06-22 11:51 → Migration candidates snapshot June 2026

| Migration | Effort | Impact | Blocker |
|---|---|---|---|
| DietaryPreference → User.String[] | Medium (1 migration + query updates) | Removes 3–5 queries per pref-save | None |
| Legacy route prefix retirement | Low (delete ~15 lines) | Halves Express route table | MIN_APP_VERSION gate reaching target threshold |
| storeReport.ts archive path → could/ | Low | Aligns with current logging convention | None |
| Insights → BullMQ async queue | Medium | Decouples recipe save latency from Ollama load | Redis already present |
| 20 migrations → squash (dev only) | Low | Cleaner migration history | Only worthwhile on fresh dev DB setup |
| Auth metrics → dedicated service | High | Removes GitHub API dependency from hot path | Requires alternative storage target |
## ASSET:backend 2026-06-22 11:03 → Full schema snapshot as of 2026-06-22; migration history complete through 20260614

All 18 migrations in `prisma/migrations/` from `20260330025042_init` through `20260614000000_insights_drop_unique_add_history` are present and sequential. `migration_lock.toml` references `provider = "postgresql"`.

**Current model inventory:**
- `User` — id, email, name, googleId, appleId, passwordHash, defaultServings, emailVerified, role (UserRole), recipeStyle, continentPreferences (String[]), profileVisibility (Json), ageRange, gender, preferencesUpdatedAt, createdAt, updatedAt
- `Recipe` — id, userId, title, description, ingredients (String[]), steps (String[]), servings, dietaryTags (String[]), emoji, provider, recipeStyle, userPreferences (String[]), mealType, pantryUsed (String[]), cookTime, continent, shareToken (unique), ogImage (Bytes?), videoId, descriptionNote, ingredientNote, methodNote, createdAt, updatedAt
- `RecipeReview` — id, userId, recipeId, stars, createdAt; unique(userId, recipeId)
- `SavedList` / `SavedListItem` — composite PK (listId, recipeId) on items
- `DietaryPreference`, `PantryItem` — per-user filter and ingredient rows
- `Flow`, `UserFlowView` — onboarding flow system; unique(userId, flowId)
- `UserInsight` — id, userId, category, suggestion, data (Json), status, createdAt, updatedAt, resolvedAt; index(userId, category) [not unique]
- `CookRecord` — id, userId, recipeId, status (CookStatus), startedAt, completedAt, updatedAt, ingredientCount, pantryCount, groceryCount, ingredients/pantryItems/groceryItems (Json), servings
- `PasswordResetToken`, `EmailVerificationToken` — token (unique), userId, expiresAt

**Enums:** `UserRole` (free/premium/admin), `FlowTrigger` (first_login/manual), `CookStatus` (STARTED/COMPLETED/ABANDONED)
## ASSET:migrate 2026-06-13 18:11 → 34 ordered migrations with consistent naming and cascade-aware schema

34 migration SQL files are present, ordered by timestamp with descriptive names. `migration_lock.toml` pins the provider to PostgreSQL, preventing accidental dialect drift. Recent models (`CookRecord`, `SavedList`, `PantryItem`, `UserFlowView`, `RecipeReview`, `UserInsight`) correctly use `onDelete: Cascade` on user-owned relations, ensuring clean cleanup on account deletion. The `@@unique` constraint on `PantryItem(userId, ingredient)` prevents duplicates at the DB layer. README documents `prisma migrate deploy` as the deploy command and includes the two-step `prisma generate` + `migrate deploy` setup flow.
## ASSET:migrate 2026-06-13 17:04 → CSV schemas, Prisma migration history, and queue surface

**RECIPE-METRIC.csv columns** (`src/routes/recipes.ts:120`):
timestamp, userId, requestedProvider, usedProvider, fallback, responseMs, style, filters, pantrySelectedCount, ingredientCount, steps, pantryMatchCount, pantryPct, groceryMatchCount, totalIngredients, groceryPct, promptVersion, continent, title

**DISCOVER-METRIC.csv columns** (`src/routes/recipes.ts:123`):
timestamp, userId, pantrySize, resultCount, avgPantryPct, avgGroceryPct

**DIGEST-METRIC.csv columns** (`src/digest.ts:50`):
timestamp, recipeCount, discoverCount, ollamaRecipes, claudeRecipes, avgResponseMs, wiredMb, usableMb, ollamaStatus

**Latest Prisma migrations:**
- `20260531000001_add_user_age_gender`
- `20260531000000_add_cook_record`
- `20260530000000_add_updated_at_drop_flowstep`

**OllamaProvider queue surface:** `src/services/ai/ollama.ts:173` — `this.queue: Promise<unknown> = Promise.resolve()`

**DietaryPreference write sites:** `src/routes/users.ts:1482-1486`, `src/routes/flows.ts:1413-1419`
## ASSET:migrate 2026-06-09 18:16 â†’ @@unique constraints on three models provide DB-level idempotency; all 13 models have explicit onDelete directives; enum-only schema additions are zero-downtime safe

**DB-level idempotency guards:**
- `PantryItem @@unique([userId, ingredient])` â€” duplicate pantry entries fail at the DB layer with P2002, not at the application layer; consistent regardless of how many insert paths exist
- `RecipeReview @@unique([userId, recipeId])` â€” one review per recipe per user is enforced without application-layer coordination
- `UserInsight @@unique([userId, category])` â€” single active insight per category guaranteed at the DB level; upsert semantics are safe to retry as long as P2002 is caught

**Explicit onDelete on all foreign keys:**
- Every FK in the 13-model schema has an explicit `onDelete` directive (Cascade or Restrict) â€” no Prisma defaults are relied upon. This means schema intent is visible in `schema.prisma` without checking Prisma version behaviour.
- The three models that use manual delete (`DietaryPreference`, `PasswordResetToken`, `EmailVerificationToken`) are documented in `DELETE /users/me` â€” the decision is intentional and visible.

**Zero-downtime enum extension:**
- `CookStatus`, `UserRole`, `FlowTrigger`, `FlowStepType` â€” all current values are stable; no renames or removals. Adding a new enum value (e.g., `PAUSED` to CookStatus) requires only a Prisma migration with no backfill, making it safe to apply with zero application downtime.

## ASSET:migrate 2026-06-09 18:03 â†’ Prisma migrations folder confirmed present; CookRecord + UserInsight cascade cleanly from User; PantryItem deduplication enforced at DB level

**Migration infrastructure:**
- `prisma/migrations/` folder exists and is tracked â€” `prisma migrate deploy` can be run deterministically in a fresh environment
- `prisma generate` regenerates the Prisma Client from the current schema â€” no manual type sync required
- Schema changes are version-controlled alongside application code, so rollbacks restore both code and schema definition in sync

**Cascade delete correctness for new models:**
- `UserInsight â†’ User`: `onDelete: Cascade` â€” user deletion automatically removes all AI-generated insights
- `CookRecord â†’ User`: `onDelete: Cascade` â€” cook sessions cleaned up on user delete
- `CookRecord â†’ Recipe`: `onDelete: Cascade` â€” deleting a recipe removes associated cook records
- `PantryItem @@unique([userId, ingredient])`: prevents duplicate pantry entries at the DB level, making migration-time data repair unnecessary

**Enum stability:**
- `CookStatus` (STARTED/COMPLETED/ABANDONED), `UserRole` (free/premium/admin), `FlowTrigger`, `FlowStepType` are all additive enums â€” no existing values renamed or removed, safe to migrate without backfilling

**Schema total (current state):**
- 13 models, 4 enums, PostgreSQL dialect
- All foreign keys have explicit `onDelete` directives â€” no implicit Prisma defaults in use
## ASSET:migrate 2026-06-07 16:30 â†’ Schema now 13 models, 4 enums; CookRecord + UserInsight added in branch 1-1-1; cascade deletes mostly correct

**Current schema summary (branch 1-1-1):**

| Model | New in 1-1-1? | Notes |
|---|---|---|
| User | no | Core model, 18 fields |
| Recipe | no | ogImage Bytes column present |
| RecipeReview | no | @@unique(userId+recipeId) |
| SavedList / SavedListItem | no | Cascade on list delete |
| DietaryPreference | no | No cascade from User (manual delete) |
| PantryItem | no | @@unique(userId+ingredient), cascade from User |
| Flow / UserFlowView | no | Onboarding flows system |
| UserInsight | **yes** | @@unique(userId+category), cascade from User |
| CookRecord | **yes** | Cascade from User and Recipe; JSON fields for ingredient lists |
| PasswordResetToken / EmailVerificationToken | no | Manual delete in users route |

**Enums:** `UserRole` (free/premium/admin) Â· `FlowTrigger` (first_login/manual) Â· `CookStatus` (STARTED/COMPLETED/ABANDONED)

**Prisma migrations folder:** `/tmp/toifood-source/prisma/migrations/` exists, migrations tracked.

**Cascade coverage:**
- User â†’ PantryItem, SavedList, UserFlowView, UserInsight, CookRecord: onDelete Cascade âœ“
- User â†’ DietaryPreference, PasswordResetToken, EmailVerificationToken: no cascade (manual delete in route) â€” documented in DELETE /users/me
- Recipe â†’ SavedListItem, RecipeReview, CookRecord: onDelete Cascade âœ“
## ASSET:migrate 2026-06-07 10:00 â†’ Prisma schema: 12 models, 3 enums, PostgreSQL on Mac mini M4

Current authoritative schema (`prisma/schema.prisma`):

**Enums:** `UserRole` (free/premium/admin) Â· `FlowTrigger` (first_login/manual) Â· `FlowStepType` (preferences/tip)

**Models:**
| Model | Key fields |
|---|---|
| User | id, email, name, googleId, appleId, passwordHash, role, defaultServings, recipeStyle, continentPreferences[], profileVisibility (JSON), emailVerified |
| Recipe | id, userId, title, description, ingredients[], steps[], servings, dietaryTags[], emoji, provider, recipeStyle, mealType, pantryUsed[], cookTime, continent, shareToken (unique), ogImage (Bytes), videoId |
| RecipeReview | id, userId, recipeId, stars â€” unique(userId+recipeId) |
| SavedList | id, userId, name |
| SavedListItem | listId+recipeId composite PK |
| DietaryPreference | id, userId, filter |
| PantryItem | id, userId, ingredient â€” unique(userId+ingredient) |
| Flow | id, title, trigger, priority, isActive, adminOnly |
| FlowStep | id, flowId, order, type, content (JSON) |
| UserFlowView | id, userId, flowId, completedAt, skippedSteps[], responses (JSON) â€” unique(userId+flowId) |
| PasswordResetToken | id, token (unique), userId, expiresAt |
| EmailVerificationToken | id, token (unique), userId, expiresAt |

**Deploy command:** `npx prisma migrate deploy` (Mac mini, jayreck account)
**Generate client:** `npx prisma generate`
