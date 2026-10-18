SHOULD ISSUE LOG
prompt: review and update ARCHITECTURE ISSUE decisions for 2026Q4
path: should/ARCHITECTURE-ISSUE-2026Q4.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ISSUE:ARCHITECTURE 2026-10-19 09:24 ▸ Update to the 2026-10-12 entry: the repo has no CI at all, so the proposed CI replay check needs a pipeline built first; the setup script reuses the committed test DB password for production; two earlier statements are corrected; the code is still frozen at `3c7572d`

**Context.** `toifood/ts-toifood-back` `main` is still at `3c7572d` (2026-09-24T23:42Z). Listing commits since 2026-09-20 returns only that commit. I checked every open item again today against a full tarball of `main`. The following are unchanged:
- `verifyPin` (`src/domains/auth/register.ts:231`) still returns a session token (`:252`).
- `requestPin` (`:268`) is still not gated on `passwordHash`.
- `src/modules/email/register.ts:51` still logs `to=${to}`.
- `/chat` `router.post("/")` (`src/routes/chat.ts:55`) still has no auth. `getRecentLogs` still runs `pm2 logs toifood-back … 2>&1`.
- The process-wide `dns.setDefaultResultOrder("ipv4first")` and `net.setDefaultAutoSelectFamily(false)` calls are still in `src/index.ts:18-19`, and `package.json` still has no `engines` field.
- `pg_dump`/`backup` still appears 0 times in `README.md` and `scripts/macmini-setup.sh`.
- `docs/` still contains only `ERD.md`.
- `.env.example` still has no `REDIS_URL`, but `vitest.config.ts` sets `REDIS_URL: "redis://localhost:6379"`.
- `requireTier` (`src/modules/role/register.ts:44`) is still not used by any route.
- There are still 94 migrations. None of them runs `CREATE TABLE` for `UserInsight`, `RecipeReview`, `Property`, `Draft` or `Notification` (each count is 0).

**NEW 7. There is no CI, so the "add as a CI job" fixes have nowhere to go.**
- The repo has no `.github/` directory, and the tree contains no other CI config.
- `package.json` scripts are only `test`, `test:watch` and `erd`. There is no `migrate`/`db:*` script.
- The fixes proposed on 2026-10-05 and 2026-10-12 (`prisma migrate diff --exit-code`, migrate-deploy replay into an empty Postgres, ERD staleness check) all assume a pipeline that doesn't exist. Nothing ever runs `vitest` automatically either.
- The test database `toifood_test` is never built from migrations. `src/__tests__/helpers/db.ts` only `deleteMany`s 12 models on an existing database. So the test suite cannot detect the five-missing-tables problem, and it doesn't reset `Review`, `Note`, `Draft`, `Notification`, `RecipeReview` or `Property` between tests.
- **Fix:** add a minimal `.github/workflows/ci.yml` with a `postgres:16` service container. Steps: `npm ci`, then `npx prisma migrate deploy`, then `npx prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url $SHADOW --exit-code`, then `npm test`. Also run `npm run erd && git diff --exit-code docs/ERD.md`. The `migrate deploy` step will fail until item 4's baseline migration lands. That is the intended signal, so land them together.

**NEW 8. The production DB password is probably the committed test password.**
- `scripts/macmini-setup.sh:78` writes the production `DATABASE_URL` as `postgresql://toifood:toifood_secret_change_me@localhost:5432/toifood`.
- The same role and password are committed in `.env.test:1` and hardcoded in `vitest.config.ts`.
- Unless someone changed the password after setup, which nothing records, the production credential is public in the repo.
- Exposure is limited because Postgres listens on `localhost:5432` behind the Cloudflare Tunnel. But any foothold on the host, or a future change to `listen_addresses`, would be enough.
- The test and production databases share one role on one cluster. Running `npm test` on the Mac mini wipes `toifood_test` using a role that can also write to `toifood`.
- **Fix:** rotate the `toifood` role password, and have the setup script generate one (`openssl rand`). Give tests their own role, limited to `toifood_test`. Do the rotation together with the `pg_dump` step so the backup procedure uses the new credential.

**Corrections to earlier entries.**
- *PIN login (item 1):* the code comment does **not** call this "verification only". `src/domains/auth/register.ts:229-230` says the endpoint "both verifies AND signs in", and `:261-267` says OAuth accounts can use it "on demand". So signing in by PIN is a deliberate behaviour of the code. What is still open is the narrower issue: no product or security decision records that an OAuth-only account's security now depends on its email inbox, and no test covers `verify-pin` for a user with `passwordHash = null`. Item 1 is reduced from "suspected bug" to "decision to record plus a test to add".
- *README (item 6):* `README.md` mentions `Favourite` **2** times, not 9. It is still stale, but the cleanup is smaller.

**Revised Q4 order** (replaces the 2026-10-12 order):
1. (2) Add auth to `/chat` and redact emails from the logs.
2. (5) Take a schema-only and a full `pg_dump`, then (8) rotate the DB password.
3. (4) Add the baseline and catch-up migrations and (7) CI in the same PR, so the replay check passes when it first runs.
4. (1) Record the decision on PIN login for OAuth accounts and add the test.

Items 3 and 6 remain documentation and cleanup.
## ISSUE:ARCHITECTURE 2026-10-12 10:43 ▸ Update to the 2026-10-05 baseline: the schema/migration drift is worse than recorded — 5 models are never created, and a fresh `prisma migrate deploy` fails at `20260530000000`; all other items are still open at `3c7572d`

**Context.** `toifood/ts-toifood-back` `main` is still at `3c7572d` (2026-09-24T23:42Z). Listing commits since 2026-09-24 returns only that one. I checked items 1, 2, 3, 5 and 6 of the 2026-10-05 entry again today against `main`, and they are unchanged:
- `verifyPin` still issues a login token: `src/domains/auth/register.ts:231`, `:256`.
- `requestPin` is still not gated on `passwordHash`: `:264-268`.
- `to=${to}` is still logged at `src/modules/email/register.ts:51`.
- The `/chat` route has no auth check: `src/routes/chat.ts:55`, `pm2 logs` at `:33`.
- The process-wide IPv4 settings are still at `src/index.ts:18-19`, and `package.json` still has no `engines` field.
- `README.md` and `scripts/macmini-setup.sh` still mention `pg_dump`/backup 0 times.
- `docs/` contains only `ERD.md`.
- `.env.example` still has no `REDIS_URL`.
- `README.md` still mentions `Favourite` 9 times.
- `requireTier` is still unused (`src/modules/role/register.ts:44`).

This entry replaces **item 4** (schema/migration drift). All 94 `migration.sql` files were downloaded and searched for `CREATE TABLE`, `RENAME TO`, and `DROP TABLE`.

**4 (updated). Five schema models are never created by any migration, and three of them are later altered, so replaying the migrations from scratch fails.**

| Model in `prisma/schema.prisma` | `CREATE TABLE` in migrations | First migration that references it |
|---|---|---|
| `UserInsight` (`:686`) | none | `20260530000000_add_updated_at_drop_flowstep` (`ALTER TABLE "UserInsight" ADD COLUMN "updatedAt"`, line 18) |
| `RecipeReview` (`:332`) | none | `20260711120000_updated_at_everywhere_drift_cleanup` (`ALTER TABLE "RecipeReview" ADD COLUMN "updatedAt"`) |
| `Property` (`:488`) | none | `20260828000000_property_type_own_enum` (`ALTER TABLE "Property" ALTER COLUMN "type" TYPE "PropertyType"`) |
| `Draft` (`:577`, enum `DraftType` `:565`) | none | never referenced, and `DraftType` is never created either |
| `Notification` (`:627`) | none | never referenced |

None of these come from a rename. The only table rename in the migrations is `DietaryPreference → Preference`. So the 2026-10-05 statement that "`UserInsight` matches one migration" was wrong: the matches are all `ALTER`s on a table that no migration creates.

**Why this matters.** Running `prisma migrate deploy` on an empty database fails at migration 23 of 94 (`20260530000000`) with `relation "UserInsight" does not exist`. That breaks:
- disaster recovery onto a new host,
- `.env.test` / vitest databases built from migrations (`src/__tests__/helpers/db.ts`),
- any staging environment.

Production works only because those tables were created outside the migration history, probably with `prisma db push`. The live database is therefore the only complete source of the schema. Together with item 5 (no backup), losing the Mac mini would lose both the data and part of the DDL.

**Fix.**
1. Run `pg_dump --schema-only` on the live database **first**. It is currently the only record of the DDL for these five tables.
2. Add a baseline migration, ordered before `20260530000000`, that creates `UserInsight` in its pre-May shape. Then add a catch-up migration that creates `RecipeReview`, `Property` (or reorder so it is created before `20260828000000`), `Draft`/`DraftType`, and `Notification`. Mark both migrations as applied in production with `prisma migrate resolve --applied`.
3. Prove it works by running `prisma migrate deploy` into an empty Postgres container, then `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --exit-code`. Add both commands as a CI job.

**Revised Q4 order:**
1. (2) Add auth to `/chat` and redact emails from the logs.
2. Take the schema-only plus full `pg_dump` (item 5). This now unblocks item 4.
3. (1) Decide whether PIN login is allowed for OAuth-only accounts.
4. (4) Add the baseline and catch-up migrations and the CI replay check.

Items 3 and 6 remain documentation and cleanup.
## ISSUE:ARCHITECTURE 2026-10-05 10:08 ▸ Q4 opening baseline: no commits since `3c7572d` (2026-09-24), so every Q3 item is still open, led by PIN login for OAuth accounts, emails exposed through the unauthenticated `/chat !logs`, and the missing database backup/restore procedure

**Context.** This is the first entry in the 2026Q4 log. `toifood/ts-toifood-back` `main` still ends at `3c7572d` (2026-09-24T23:42Z). Listing commits since 2026-09-24 returns only that one, so nothing has changed since the 2026-09-28 Q3 entry. Every item below was checked again today against `main` (not copied forward) so this quarter starts from a correct open-items list.

**1. OAuth-only accounts can still be signed into with a PIN (open since `e117fa3`).** `requestPin` (`src/domains/auth/register.ts:268`) no longer checks `passwordHash`. `verifyPin` (`:231`) calls `verifyPinForUser` and then returns a session token with `metric: { event: "login", method: "pin" }` (`:256`). So a google/apple account can be signed into by anyone who controls its mailbox. The inline comment at `:282` still calls this "verification", but the endpoint issues a login. To fix: either have `verifyPin` return a verify-only result with no token when `passwordHash` is null, or record that PIN login is an intended second sign-in method. Then add a `verify-pin` test for an OAuth user to `src/__tests__/emailPin.test.ts`.

**2. Recipient emails are logged, and `/chat` still has no auth.** `src/modules/email/register.ts:51` still logs `to=${to}` on every SMTP accept. `src/routes/chat.ts:55` `router.post("/")` dispatches `!logs` without checking a token or signature. `getRecentLogs` (`:33`) runs `pm2 logs toifood-back --lines 20 --nostream 2>&1`, so anyone who can reach the endpoint can read users' email addresses. To fix: log `userId` instead (as `src/modules/emailpin/register.ts` already does on failure), and verify the Google Chat bearer JWT before running any command.

**3. The IPv4 workaround applies to every outbound connection in the process.** `src/index.ts:18-19` (`dns.setDefaultResultOrder("ipv4first")`, `net.setDefaultAutoSelectFamily(false)`) is still process-wide. It affects OpenAI, YouTube, Slack, the IdP key fetches, and store metrics, not only Gmail SMTP. The host constraint is still not recorded in `README.md` or `scripts/macmini-setup.sh`. `package.json` still has no `engines` field, even though `setDefaultAutoSelectFamily` needs Node ≥ 20. To fix: scope the change to a custom `lookup` on the nodemailer transport, or document it in the deploy runbook and add `"engines": { "node": ">=20" }`.

**4. The schema declares three models that no migration creates.** `prisma/schema.prisma` has 20 models, including `Draft`, `Notification`, and `UserInsight`. A code search of `prisma/migrations` finds no `CREATE TABLE "Draft"` and no `CREATE TABLE "Notification"`. `UserInsight` matches one migration, but its later reshapes (`20260817010000_userinsight_slot_shape`, `20260819000000_userinsight_title_body`) still need checking against the schema. The latest migration is still `20260828030000_preference_type_value_index`. `docs/ERD.md` is generated from `Prisma.dmmf` (`scripts/generate-erd.ts`), so it shows these tables as if they exist. A fresh `prisma migrate deploy` (for example, during disaster recovery) would produce a database that doesn't match the schema. To fix: run `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma`, commit the missing migration, and add that diff as a CI check so it stays fixed.

**5. Recovery gaps (still open).**
- There is still no PostgreSQL backup/restore procedure. `pg_dump`/"backup" appears 0 times in `README.md` and `scripts/macmini-setup.sh`. This has been the top recovery gap since 2026-07-06. The database is on the same Mac mini as the API (`:5432`), so losing the host loses the data.
- `docs/` contains only `ERD.md`. Both runbooks that `README.md` links to (`docs/macmini-deployment.md`, `docs/openclaw-integration.md`) are still missing.
- `.env.example` still has no `REDIS_URL`.

**6. Leftover code and docs (still open).**
- `README.md` still mentions `Favourite` 9 times, but that table was dropped in `20260414000000_remove_favourite_table`.
- `requireTier` is still defined (`src/modules/role/register.ts:44`) but no route uses it. The only other source reference is a comment in `src/domains/list/register.ts:50`.
- `npm run erd` is still run manually, and no CI check catches a stale `docs/ERD.md`.

**Suggested Q4 order:** (2) `/chat` auth plus email redaction, then (1) the PIN login decision, then (5) backup/restore, then (4) the migration catch-up and CI drift check. Items 3 and 6 are documentation and cleanup.
