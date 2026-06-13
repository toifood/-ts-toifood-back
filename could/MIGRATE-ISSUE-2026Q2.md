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
