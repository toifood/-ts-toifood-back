SHOULD ISSUE LOG
prompt: review and update migration plans, version upgrades, breaking changes, deprecation paths, schema changes
path: should/MIGRATE-ISSUE-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:MIGRATE {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:MIGRATE 2026-06-28 18:28 ▸ 22 migrations in 2.5 months with add-then-remove schema churn; no rollback scripts or migration guard for UserInsight history transition

**High migration churn (22 in ~11 weeks)**: The Prisma migration history in `prisma/migrations/` shows rapid schema evolution from 20260330 (init) through 20260614. At this cadence any production deployment must run `prisma migrate deploy` before starting the server — there is no evidence of a pre-deploy migration check in the startup or CI pipeline.

**Add-then-remove schema churn**: `20260417011415_add_recipe_match_data` added match columns to `Recipe`; `20260417014518_remove_recipe_match_columns` removed them hours later. Similarly, `20260415_add_flow_system` introduced `FlowStep` which was then dropped in `20260530_add_updated_at_drop_flowstep`. This indicates exploratory schema work being committed to production migrations rather than prototyped behind feature flags, leaving migration history permanently polluted.

**No rollback scripts**: All migrations are forward-only. If `20260614_insights_drop_unique_add_history` causes a production issue (e.g. query plans degrade without the unique constraint), there is no documented rollback SQL to restore it.

**UserInsight unique→history transition data risk**: `20260614` drops `UserInsight_userId_category_key` unique constraint and replaces it with a non-unique index. Existing rows with duplicate `(userId, category)` pairs that were previously prevented are now valid. The application logic in `src/routes/insights.ts` uses `findFirst` with `orderBy: createdAt desc` to surface the latest pending insight per category — this is correct for new history-style data, but any pre-migration rows with status=`pending` and duplicate category will accumulate silently.

**`dump.rdb` in version control**: Redis RDB file committed to repo root. Should be added to `.gitignore`; historical commits may contain session or rate-limit data.
