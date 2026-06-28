SHOULD ISSUE LOG
prompt: review and update migration plans, version upgrades, breaking changes, deprecation paths, schema changes
path: should/MIGRATE-ISSUE-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:MIGRATE {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:MIGRATE 2026-06-28 18:28 ▸ 22 migrations in 2.5 months with add-then-remove schema churn; no rollback scripts or migration guard for UserInsight history transition
## ISSUE:MIGRATE 2026-06-29 06:28 ▸ Application-level dedup compensates for removed unique constraint; MIN_RECIPES and cooldown constants are baked in with no config path

**Application-level dedup post-20260614**: After dropping `UserInsight_userId_category_key`, the unique constraint is now enforced by application logic in `runInsightAnalysis`: `findFirst(where: { userId, category, status: 'pending' })` then `update` vs `create`. This is correct but brittle — any direct DB write, admin tooling, or second concurrent analysis job bypasses this guard. The dedup logic is not atomic (findFirst + conditional create is a race condition under concurrent triggers).

**Hardcoded service constants**: `MIN_RECIPES = 5` and `ANALYSIS_COOLDOWN_SEC = 7 * 24 * 60 * 60` are compile-time constants in `src/services/ai/insights.ts`. Tuning them requires a code deploy. No environment variable overrides are available.

**No migrations since 20260614**: The most recent migration is `20260614_insights_drop_unique_add_history`. The schema appears stable. The `CookRecord` model introduced in `20260531` is fully wired — `src/routes/cookRecords.ts` is mounted at `/1-1-1/api/records` and on the legacy path. No pending schema changes are detectable from the current codebase.

**High migration churn (22 in ~11 weeks)**: The Prisma migration history in `prisma/migrations/` shows rapid schema evolution from 20260330 (init) through 20260614. At this cadence any production deployment must run `prisma migrate deploy` before starting the server — there is no evidence of a pre-deploy migration check in the startup or CI pipeline.

**Add-then-remove schema churn**: `20260417011415_add_recipe_match_data` added match columns to `Recipe`; `20260417014518_remove_recipe_match_columns` removed them hours later. Similarly, `20260415_add_flow_system` introduced `FlowStep` which was then dropped in `20260530_add_updated_at_drop_flowstep`. This indicates exploratory schema work being committed to production migrations rather than prototyped behind feature flags, leaving migration history permanently polluted.

**No rollback scripts**: All migrations are forward-only. If `20260614_insights_drop_unique_add_history` causes a production issue (e.g. query plans degrade without the unique constraint), there is no documented rollback SQL to restore it.

**UserInsight unique→history transition data risk**: `20260614` drops `UserInsight_userId_category_key` unique constraint and replaces it with a non-unique index. Existing rows with duplicate `(userId, category)` pairs that were previously prevented are now valid. The application logic in `src/routes/insights.ts` uses `findFirst` with `orderBy: createdAt desc` to surface the latest pending insight per category — this is correct for new history-style data, but any pre-migration rows with status=`pending` and duplicate category will accumulate silently.

**`dump.rdb` in version control**: Redis RDB file committed to repo root. Should be added to `.gitignore`; historical commits may contain session or rate-limit data.
