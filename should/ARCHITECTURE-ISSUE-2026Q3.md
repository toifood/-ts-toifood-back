SHOULD ISSUE LOG
prompt: review and update ARCHITECTURE ISSUE decisions for 2026Q3
path: should/ARCHITECTURE-ISSUE-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ISSUE:ARCHITECTURE 2026-07-06 07:25 ▸ Single-host SPOF, Redis missing from bootstrap, README/shared-types drift behind July schema

**Single point of failure — no recovery path documented.** The entire stack (Node :3000, PostgreSQL :5432, Ollama :11434, Cloudflare Tunnel) runs on one Mac mini M4. There is no PostgreSQL backup/restore procedure anywhere in the repo (`scripts/macmini-setup.sh` provisions but never schedules `pg_dump`), and metrics live as unrotated CSVs on local disk (`would/RECIPE-METRIC.csv`, `DISCOVER-METRIC.csv`, `DIGEST-METRIC.csv` — see `src/digest.ts`, `src/slack-bot.ts`). Machine loss = total data loss of users, recipes, and metrics. A backup cron + off-machine copy should be the top recovery item this quarter.

**Rate limiting depends on Redis, but Redis is not provisioned.** `src/middleware/rateLimit.ts` enforces role-based daily caps (free: 3 ollama / 2 claude) via ioredis with an atomic Lua INCR+EXPIRE, and on Redis failure it logs a warning and **skips the limit**. `scripts/macmini-setup.sh` installs Homebrew, Node 22, PostgreSQL 16, and PM2 — never Redis. On a fresh machine rebuild, free users get unlimited Claude (paid API) generations silently. Either add `brew install redis` to the setup script or fail closed for the `claude` provider.

**Setup script drift vs. reality.** `scripts/macmini-setup.sh` clones `https://github.com/jayreck996/ts-toifood-back.git` while the canonical repo is `toifood/ts-toifood-back`; it writes `OLLAMA_MODEL=qwen2.5-claw:7b` while code default and README say `qwen2.5:7b`; and it seeds `toifood_secret_change_me` as the live DB password with only an echo reminder. The script is the de-facto disaster-recovery runbook, so this drift breaks recovery exactly when it's needed.

**README documents a schema that no longer exists.** README still lists the `Favourite` model and `/favourites` routes (table dropped in migration `20260414000000_remove_favourite_table`, replaced by `SavedList`/`SavedListItem`), omits the `/1-1-6/` versioned prefixes, and omits chat/insights/lists/records/store-metrics routes entirely. Likewise `shared/src/index.ts` `User` still exposes `isPremium: boolean` while `prisma/schema.prisma` moved to `role: UserRole (free|premium|admin)` — the shared contract with the mobile app lags the schema.

**Legacy route migration has no end date.** `src/index.ts` mounts every router twice (`/1-1-6/...` and bare legacy paths) "until old builds phase out", but nothing measures legacy traffic to decide when. The request logger already captures paths — aggregate it and set a removal criterion, or the duplication becomes permanent.

**Scale-up hazards baked into single-process assumptions.** `OllamaProvider` serializes all generations through an in-process promise queue (`src/services/ai/ollama.ts`) and `/stats` uses an in-memory 60s cache (`src/index.ts`); both silently break under PM2 cluster mode. Also `uncaughtException` is logged but the process keeps running in unknown state — prefer log-then-exit and let PM2 restart. Minor: committed build artifact `shared/src/index.js`; `express-rate-limit` dependency appears unused now that limiting is custom Redis; `@types/*` packages sit in `dependencies` instead of `devDependencies`; Prisma pinned at 5.14 (6.x is current).
