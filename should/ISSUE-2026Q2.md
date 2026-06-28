SHOULD ISSUE LOG
prompt: review and update GENERAL ISSUE decisions for 2026Q2
path: should/ISSUE-2026Q2.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:DUMP_RDB 2026-06-28 13:12 → dump.rdb Redis snapshot committed to repo

`dump.rdb` is tracked in the repo tree. Redis is used for rate-limiting via `ioredis` (`package.json`); a persisted snapshot may contain IP-keyed rate-limit state. Should be added to `.gitignore` and removed from history, or replaced with a safe empty fixture if needed for tests.

## ISSUE:LEGACY_ROUTES 2026-06-28 13:12 → No phase-out date set for v1-1-0 legacy route mounts

`src/index.ts` dual-mounts all routes at root (`/auth`, `/recipes`, `/users`, `/pantry`, `/flows`, `/admin`, `/lists`, `/chat`, `/insights`, `/store-metrics`) alongside `/1-1-1/` prefixed equivalents. Comment says "keep alive until old builds phase out" but no minimum-version gate or deadline is enforced. `/app-config` returns `minVersion` (default `"1.0.6"`) — this is the intended enforcement mechanism but has not been wired to a legacy-route removal plan.

## ISSUE:CASCADE_GAP 2026-06-28 13:12 → DietaryPreference lacks onDelete: Cascade — orphan rows on user deletion

`prisma/schema.prisma`: `DietaryPreference.user` relation has no `onDelete: Cascade`. Deleting a user will orphan `DietaryPreference` rows. All other user-owned models (`PantryItem`, `SavedList`, `RecipeReview`, `UserInsight`, `CookRecord`, `UserFlowView`) correctly specify `onDelete: Cascade`.

## ISSUE:INSIGHT_PURGE 2026-06-28 13:12 → UserInsight rows accumulate without a bounded purge strategy

Migration `20260614000000_insights_drop_unique_add_history` dropped `UserInsight_userId_category_key` unique constraint so insights accumulate as history. `GET /insights` returns only the latest pending per category (`orderBy: createdAt desc`). No TTL or max-rows-per-category policy exists; table will grow unbounded as AI insights are generated.

## ISSUE:RECOVERY 2026-06-28 13:12 → No DB backup or restore procedure documented

Only operational runbook is `scripts/macmini-setup.sh` (initial setup). No pg_dump schedule, backup destination, or restore steps are documented. Server runs on a single Mac mini M4 with a local PostgreSQL instance — single point of failure with no documented recovery path.
