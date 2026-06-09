ISSUE LOG - MIGRATE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:migrate {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:migrate 2026-06-09 18:16 → JSON column format versioning absent across four models; profileVisibility and FlowStep.content have no schema enforcement; onboarding response data locked in unqueryable JSON blobs

**Unversioned JSON shapes in four models:**
- `FlowStep.content` (JSON) — stores onboarding step configuration including type-specific fields (preferences step vs. tip step). If the flow editor changes the content schema (new keys, renamed keys), existing `UserFlowView.responses` rows hold data in the old format. There is no migration script, version field, or discriminator to distinguish old vs. new response shapes. Parsing logic that expects the new shape will produce silent `undefined` on old rows.
- `UserFlowView.responses` (JSON) — captures per-step user responses keyed to step order or step ID. Any change to step numbering or ID scheme in `FlowStep` invalidates historical response keys with no detectable error.
- `User.profileVisibility` (JSON) — stores display preference flags with no Prisma validator or Zod schema. Unknown keys silently persist and stale keys silently remain after a feature removal.
- `Recipe.ogImage` (Bytes) — not a JSON column but has the same unbounded growth problem: no row-level size cap, no S3 archival trigger, and no migration to move existing blobs out of PostgreSQL into object storage.

**No JSON migration strategy:**
- Prisma has no native `jsonb_set` migration helper. Format changes require a standalone data migration script that must be written, tested, and run manually — none is present in the repo for any of these columns.
- Recommendation: Add a `schemaVersion` field to `FlowStep.content` and `UserFlowView.responses`, and validate shape at read time with a Zod parser that returns a typed default for unknown versions.

## ISSUE:migrate 2026-06-09 18:03 → Concurrent recipe saves can trigger parallel UserInsight upserts; no retry on P2002 collision; manual cascade gaps accumulate with each new delete path

**Concurrent upsert race on UserInsight:**
- `runInsightAnalysis()` is called during recipe save flow. If two recipe saves complete simultaneously for the same user (e.g., batch import or retry), two parallel calls attempt `prisma.userInsight.upsert` on `@@unique([userId, category])`. Under Prisma with PostgreSQL, concurrent upserts on the same unique key can both reach the INSERT path before either updates — only one succeeds; the other throws P2002. There is no retry handler or idempotency guard in the insight service.

**Insight analysis scope on every recipe save:**
- `runInsightAnalysis()` generates insights across ALL categories (not just the category of the new recipe). On each recipe save, this means one AI call per insight category per user. For a user with 5 active insight categories, saving a recipe fires 5 AI calls — all trying to upsert into the same `@@unique([userId, category])` table simultaneously.

**Growing manual cascade gap:**
- As new models are added (CookRecord, UserInsight), the pattern of manually deleting some models in `DELETE /users/me` and relying on schema cascade for others is diverging. Currently `PasswordResetToken` and `EmailVerificationToken` are manually deleted; if a future developer adds a new model with `onDelete: Restrict` by mistake, user deletion silently fails with FK error. No schema audit step exists in the delete route.

**Action needed:** Wrap insight upserts in a try/catch with P2002 retry or use a queued job. Audit all models for cascade vs. manual delete consistency and document the decision per-model.
## ISSUE:migrate 2026-06-07 16:30 → CookRecord and UserInsight models added in 1-1-1 with no documented migration path; ogImage Bytes column growing unbounded

**New models since last analysis (1-1-1 branch):**
- `CookRecord` — tracks cook session lifecycle (STARTED/COMPLETED/ABANDONED), stores `ingredients`, `pantryItems`, `groceryItems` as JSON blobs, plus `pantryCount`/`groceryCount` counters
- `UserInsight` — AI-generated per-category suggestions with `@@unique([userId, category])` constraint meaning only one pending insight per category per user at a time
- `RecipeReview` — star rating model with `@@unique([userId, recipeId])`

**Migration risks:**
- `ogImage Bytes` column on Recipe has no size cap — as recipe count grows, PostgreSQL table bloat will increase significantly. No archival strategy exists.
- `UserInsight.data` and `CookRecord.ingredients/pantryItems/groceryItems` are all raw `Json` columns with no schema enforcement — any structural change to AI output or ingredient format silently passes.
- `@@unique([userId, category])` on UserInsight means upsert collisions will silently overwrite insight data if Prisma uses `upsert` in insights service — verify this is intentional.
- `DietaryPreference` lacks cascade delete from User in schema — manual deletion required in `DELETE /users/me` route (and currently is done manually, but if a new delete path is added without mirroring, orphans will accumulate).
## ISSUE:migrate 2026-06-07 10:00 → Schema far ahead of README docs; appleId, role enum, ogImage, shareToken, and 8 undocumented models added

Prisma schema has grown significantly beyond what README describes. The following are present in schema but undocumented:

**Undocumented models:** `RecipeReview`, `SavedList`, `SavedListItem`, `PantryItem`, `Flow`, `FlowStep`, `UserFlowView`, `PasswordResetToken`, `EmailVerificationToken`

**Undocumented User fields:** `appleId` (Apple Sign-In), `role` (UserRole enum: free/premium/admin), `defaultServings`, `recipeStyle`, `continentPreferences`, `profileVisibility` (JSON), `emailVerified`

**Undocumented Recipe fields:** `shareToken` (unique, OG sharing), `ogImage` (Bytes, canvas-generated), `videoId` (YouTube), `continent`, `pantryUsed`, `provider`, `recipeStyle`, `emoji`, `mealType`, `cookTime`

**Risk:** No migration history visible in repo — only `schema.prisma`. Anyone running `prisma migrate deploy` in a fresh environment has no audit trail of how schema evolved. `profileVisibility` stored as raw JSON with no type enforcement; `ogImage` as Bytes will grow large in PostgreSQL over time.

**Action needed:** Run `prisma migrate status` to verify migration history exists on the Mac mini. Document all schema additions in README. Consider archiving `ogImage` blobs to object storage rather than DB columns.
