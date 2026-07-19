SHOULD ASSET LOG
prompt: review and update ARCHITECTURE ASSET decisions for 2026Q3
path: should/ARCHITECTURE-ASSET-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ASSET:ARCHITECTURE 2026-07-20 07:12 ▸ Recipe/user flagging + admin moderation queue, username system, list color theming; topology/AI/routing/Redis/ops unchanged since 2026-07-13

Delta since the 2026-07-13 entry — topology, AI-provider abstraction, route versioning, Redis rate limits, Follow graph, timestamp-state user model, Visibility enum, and Slack/digest/Chat ops are unchanged below this entry.

**Flagging + moderation (migrations `20260715100000`–`110000`, `src/routes/reports.ts`, `src/routes/admin.ts`).** `RecipeReport`/`UserReport` are separate tables (different owners/cascades) sharing the same shape: `flagType` (`red`=report, `green`=endorse), optional `reason` (required for red, null for green), and a status cycle `pending → accepted/rejected → closed → (re-flag) → pending`. Re-flagging, including flipping red↔green, upserts the same row via the `[reporterId, recipeId]`/`[reporterId, targetId]` unique constraint and resets to pending — same reuse pattern as `Follow`. Self-report is blocked at the route level. Admin queues at `GET /admin/reports/{recipes,users}` (role-gated via `requireAdmin`) filter by status/flagType and decide via `PATCH .../:id/:decision(accept|reject|close)`, stamping `reviewedAt`/`reviewedBy`; `close` is only reachable from `accepted`/`rejected`.

**Username system (migrations `20260715120000`→`130000`, `src/lib/username.ts`).** Two-stage rollout: column added nullable, existing rows backfilled by a script run out-of-band (logged in `ts-toifood-dev`, not this repo), then locked `NOT NULL UNIQUE`. `generateUsername()` slugifies a seed (name or email) to ≤14 chars, appends 3-4 random digits, retries up to 20 times against the unique constraint before throwing. `USERNAME_REGEX` (app-layer only, no DB CHECK) requires letter+digit; a pure-letters username is reachable only via manual SQL, a deliberate escape hatch per the schema comment. All three registration paths (local, Google, Apple) in `src/routes/auth.ts` generate a username at account creation.

**List color theming (migration `20260719100000`, `src/routes/lists.ts`).** `ListColor` enum (`pro/free/admin/classic/creative/neutral/premium/basic/beta`) matches the frontend's `LabelVariant` theme set. New lists default to a random color if none is given; `PATCH` accepts a color-only update alongside (or instead of) rename. Schema now stands at 15 models as of `20260719100000_savedlist_color` (up from 13 on 2026-07-13, adding `RecipeReport`/`UserReport`).

**Recipe share tracking refined (migration `20260718100000`).** `shareToken` (permanent, `nanoid(10)`, set at generation time) is unconditionally public. `POST /recipes/:id/share` now also stamps `shareUpdatedAt` to record when the user last tapped the share button — distinct from the permanent token and from the row's general `updatedAt` — same nullable/not-backfilled convention as `visibilityUpdatedAt`/`User.preferencesUpdatedAt`.
## ASSET:ARCHITECTURE 2026-07-13 07:12 ▸ July 11–12 wave: Follow graph, timestamp-state user model, Visibility enum, auth-metrics pipeline, Google Chat ops

Delta since the 2026-07-06 entry — topology, AI-provider abstraction, route versioning, Redis rate limits, and Slack/digest ops are unchanged below this entry.

**Follow system (migration `20260711000000_add_follow_model`).** `Follow` is a timestamp-state machine — `acceptedAt` (pending → active), `unfollowedAt` (ended; re-follow reuses the unique `[followerId, followeeId]` row), `mutedAt`, `blockedAt` — no booleans. `src/routes/follows.ts` serves own and friend-view following/followers/pending lists; friend views are gated by `User.followVisibility` (`PATCH /follows/visibility` toggles it). Mounted at `/1-1-6/api/follows` + legacy `/follows`; `/users/me` now returns following/followers counts.

**Timestamp-state user model (migrations `20260711100000`–`130000`).** Booleans replaced by nullable timestamps on User: `premiumSince`/`premiumUntil` (active premium = `premiumUntil` in the future; `src/lib/premium.ts` is the single source of truth, admins always premium), `emailVerifiedAt`, `passwordSetAt` (null = OAuth-only). `20260711120000` backfilled `updatedAt` everywhere as drift cleanup. New `GET /admin/users` (admin-role guard) lists all users and derives linked providers `[google|apple|password]` from data rather than flags.

**Visibility enum (migrations `20260712100000`–`120000`).** `Visibility { private, public }` now gates `SavedList.visibility` and `User.followVisibility`, both defaulting `public` — chosen over share tokens after same-day iteration. Schema stands at 13 models as of `20260712120000_visibility_default_public`.

**Auth metrics pipeline.** Every non-local auth event is appended to `would/AUTH-METRIC.csv` (timestamp, event, method, userId, success, failReason, ip) and mirrored fire-and-forget to GitHub (`toifood-dev/ts-toifood-dev` via `TOIFOOD_CROSS_REPO_TOKEN`). Auth endpoints are rate-limited with `express-rate-limit` (10 req/15 min). Apple sign-in verifies tokens against a 1-hour-cached Apple JWKS.

**Google Chat ops.** `POST /chat` mirrors the Slack bot (`!status`/`!logs`/`!metrics` from pm2 and `would/*.csv`) as a Google Chat app endpoint; alerting also flows through the `chatAlert` webhook helper (`src/lib/chat.ts`). Client force-update floor `/app-config` `minVersion` now defaults to `1.1.9`. Claude provider (`src/services/ai/claude.ts`) uses `claude-haiku-4-5` with JSON-schema structured output (`claude-v5` prompt, 30 s timeout); dietary filters are enforced in the Claude prompt but deliberately omitted from Ollama prompts.
## ASSET:ARCHITECTURE 2026-07-06 07:25 ▸ Express+Prisma monolith on Mac mini M4 with pluggable AI providers, versioned routes, Redis rate limits, Slack/digest ops

**Topology.** Single Mac mini M4 behind a Cloudflare Tunnel (`toifood.co.nz`), split across two accounts: `jayreck` runs the Node.js API (:3000, PM2 `toifood-back`) and PostgreSQL 16 (:5432); `jayagent` runs Ollama (:11434, `qwen2.5:7b`), reached over `127.0.0.1`. Bootstrap is `scripts/macmini-setup.sh` (idempotent: Homebrew → Node 22 via nvm → PostgreSQL 16 → clone → `.env` with generated JWT_SECRET → `prisma migrate deploy` → PM2).

**Stack & decisions.** Node/TypeScript, Express 4, Prisma 5 + PostgreSQL, JWT auth (`src/middleware/auth.ts`) with local + Google/Apple sign-in, `trust proxy` for tunnel IPs, CORS allowlist via `CORS_ORIGIN`. AI generation sits behind an `AIProvider` interface (`src/services/ai/provider.ts`) with three implementations — Ollama (default; JSON-format prompt, 65s timeout, in-process request queue, CJK-bleed stripping, `ollama-v5` prompt version), OpenAI, Claude — selected by `AI_PROVIDER` (`src/services/ai/index.ts`). Region/continent is picked server-side from a curated `COUNTRY_REGIONS` table; emoji inferred from a keyword table.

**Route versioning (migration in progress).** All routers are mounted under `/1-1-6/` (`/1-1-6/auth`, `/1-1-6/api/*`, `/1-1-6/system/*`) with bare legacy paths kept alive for old app builds (`src/index.ts`). `/app-config` serves `minVersion` (default `1.1.6`) as the client force-update signal. Public `/stats` returns rounded counts with a 60s in-memory cache.

**Rate limiting.** Role-based daily caps in Redis (`src/middleware/rateLimit.ts`): free 3 ollama / 2 claude, premium 10/5, admin bypass. Atomic Lua INCR+EXPIRE (24h window); fails open with a warning if Redis is down. Usage surfaced via `getRecipeUsage`.

**Schema state (as of migration `20260703000000_remove_flows_model`).** 12 models: User (role enum `free|premium|admin` replaced `isPremium`; continent prefs, profile visibility JSON, age/gender added 2026-05-31), Recipe (share tokens, OG image bytes, provider/style/mealType/pantryUsed/cookTime/continent), RecipeReview, SavedList/SavedListItem (replaced Favourite, dropped 2026-04-14), DietaryPreference, PantryItem, UserInsight (history-style since `20260614`, status column removed `20260702`), CookRecord (STARTED/COMPLETED/ABANDONED lifecycle with ingredient/pantry/grocery snapshots, added 2026-05-31), password-reset + email-verification tokens. The flow system (added 2026-04-15) was fully removed 2026-07-03.

**Ops & observability.** Slack Socket-Mode bot (`src/slack-bot.ts`) in `#toifood-ops` answers `!status`/`!logs`/`!metrics` via PM2. Daily digest (`src/digest.ts`) aggregates per-provider recipe metrics (response time, pantry/grocery match %, fallbacks) from `would/*.csv` and posts to a Google Chat webhook, logging outcomes to `DIGEST-METRIC.csv`. Per-request logging middleware records method/path/status/latency/userId. Store metrics routes plus `src/services/appstore.ts`/`playstore.ts`/`youtube.ts` pull external channel data; `src/storeReport.ts` renders reports with `@napi-rs/canvas`.
