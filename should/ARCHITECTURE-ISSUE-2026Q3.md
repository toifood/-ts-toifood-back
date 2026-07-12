SHOULD ISSUE LOG
prompt: review and update ARCHITECTURE ISSUE decisions for 2026Q3
path: should/ARCHITECTURE-ISSUE-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ISSUE:ARCHITECTURE 2026-07-13 07:12 ▸ Unauthenticated ops endpoint leaks logs, auth PII pushed to GitHub, shared-types drift widened by July 11–12 migrations; SPOF & Redis gaps still open

**NEW — `/chat` is an unauthenticated remote-ops endpoint.** `src/routes/chat.ts` is mounted at both `/chat` and `/1-1-6/api/chat` with no `requireAuth` and no verification that requests actually come from Google Chat (no bearer/ID-token check). Anyone who can reach toifood.co.nz can POST `!logs` and receive the last 20 PM2 log lines (which contain per-request userIds from the logging middleware), or `!status` for process topology. Verify Google Chat's Authorization token or require a shared secret before answering.

**NEW — auth metrics push PII to GitHub via race-prone whole-file rewrites.** `src/routes/auth.ts` appends every non-local auth event (userId, IP, fail reason) to `would/AUTH-METRIC.csv` and mirrors it fire-and-forget to GitHub via GET-full-file → append one row → PUT, once per event (single 409 retry). Concurrent auth events can drop rows (last-writer-wins), each event re-uploads the entire ever-growing CSV, and IP+userId in a git repo's permanent history is a privacy/deletion liability. Also `.env.example` documents the target as `toifood/-ts-toifood-dev` while the code constant is `toifood-dev/ts-toifood-dev` — one of them is wrong.

**Shared contract drift got worse, not better.** The July 11–12 migrations moved User to timestamp-state (`premiumSince`/`premiumUntil`, `emailVerifiedAt`, `passwordSetAt`, `followVisibility`) and `/users/me` now returns those plus follower counts — but `shared/src/index.ts` still exposes `isPremium: boolean`, `emailVerified: boolean`, `hasPassword: boolean`, a dead `Favourite` interface, and no Follow/Visibility types at all. README likewise still documents `/favourites` and predates `/follows`, the `/1-1-6/` prefixes, and the visibility system.

**Share-token → visibility churn left a stub.** Three migrations on 2026-07-12 (`share_tokens_list_follow` → `visibility_enum_replaces_share_tokens` → `visibility_default_public`) replaced list/follow share tokens with the `Visibility` enum within one day. `Recipe.shareToken`/`ogImage` remain from the older per-recipe share design — decide whether recipe sharing also moves to `Visibility`, or the churn repeats.

**Still open from 2026-07-06 (unchanged):** single Mac mini SPOF with no `pg_dump`/off-machine backup; rate limiting depends on Redis (`src/middleware/rateLimit.ts`, fails open) yet Redis is absent from `scripts/macmini-setup.sh` and `.env.example` has no `REDIS_URL`; setup script still clones `jayreck996/ts-toifood-back` instead of `toifood/ts-toifood-back` and seeds the `toifood_secret_change_me` DB password; legacy bare routes still mounted with no traffic measurement or removal criterion — client force-update floor is now `1.1.9` while the API prefix is still `/1-1-6/`, so the version signals are drifting apart. Correction to the 2026-07-06 entry: `express-rate-limit` is no longer unused — `src/routes/auth.ts` applies it (10 req/15 min) to auth endpoints.
## ISSUE:ARCHITECTURE 2026-07-06 07:25 ▸ Single-host SPOF, Redis missing from bootstrap, README/shared-types drift behind July schema

**Single point of failure — no recovery path documented.** The entire stack (Node :3000, PostgreSQL :5432, Ollama :11434, Cloudflare Tunnel) runs on one Mac mini M4. There is no PostgreSQL backup/restore procedure anywhere in the repo (`scripts/macmini-setup.sh` provisions but never schedules `pg_dump`), and metrics live as unrotated CSVs on local disk (`would/RECIPE-METRIC.csv`, `DISCOVER-METRIC.csv`, `DIGEST-METRIC.csv` — see `src/digest.ts`, `src/slack-bot.ts`). Machine loss = total data loss of users, recipes, and metrics. A backup cron + off-machine copy should be the top recovery item this quarter.

**Rate limiting depends on Redis, but Redis is not provisioned.** `src/middleware/rateLimit.ts` enforces role-based daily caps (free: 3 ollama / 2 claude) via ioredis with an atomic Lua INCR+EXPIRE, and on Redis failure it logs a warning and **skips the limit**. `scripts/macmini-setup.sh` installs Homebrew, Node 22, PostgreSQL 16, and PM2 — never Redis. On a fresh machine rebuild, free users get unlimited Claude (paid API) generations silently. Either add `brew install redis` to the setup script or fail closed for the `claude` provider.

**Setup script drift vs. reality.** `scripts/macmini-setup.sh` clones `https://github.com/jayreck996/ts-toifood-back.git` while the canonical repo is `toifood/ts-toifood-back`; it writes `OLLAMA_MODEL=qwen2.5-claw:7b` while code default and README say `qwen2.5:7b`; and it seeds `toifood_secret_change_me` as the live DB password with only an echo reminder. The script is the de-facto disaster-recovery runbook, so this drift breaks recovery exactly when it's needed.

**README documents a schema that no longer exists.** README still lists the `Favourite` model and `/favourites` routes (table dropped in migration `20260414000000_remove_favourite_table`, replaced by `SavedList`/`SavedListItem`), omits the `/1-1-6/` versioned prefixes, and omits chat/insights/lists/records/store-metrics routes entirely. Likewise `shared/src/index.ts` `User` still exposes `isPremium: boolean` while `prisma/schema.prisma` moved to `role: UserRole (free|premium|admin)` — the shared contract with the mobile app lags the schema.

**Legacy route migration has no end date.** `src/index.ts` mounts every router twice (`/1-1-6/...` and bare legacy paths) "until old builds phase out", but nothing measures legacy traffic to decide when. The request logger already captures paths — aggregate it and set a removal criterion, or the duplication becomes permanent.

**Scale-up hazards baked into single-process assumptions.** `OllamaProvider` serializes all generations through an in-process promise queue (`src/services/ai/ollama.ts`) and `/stats` uses an in-memory 60s cache (`src/index.ts`); both silently break under PM2 cluster mode. Also `uncaughtException` is logged but the process keeps running in unknown state — prefer log-then-exit and let PM2 restart. Minor: committed build artifact `shared/src/index.js`; `express-rate-limit` dependency appears unused now that limiting is custom Redis; `@types/*` packages sit in `dependencies` instead of `devDependencies`; Prisma pinned at 5.14 (6.x is current).
