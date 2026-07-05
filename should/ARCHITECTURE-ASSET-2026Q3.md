SHOULD ASSET LOG
prompt: review and update ARCHITECTURE ASSET decisions for 2026Q3
path: should/ARCHITECTURE-ASSET-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ASSET:ARCHITECTURE 2026-07-06 07:25 ▸ Express+Prisma monolith on Mac mini M4 with pluggable AI providers, versioned routes, Redis rate limits, Slack/digest ops

**Topology.** Single Mac mini M4 behind a Cloudflare Tunnel (`toifood.co.nz`), split across two accounts: `jayreck` runs the Node.js API (:3000, PM2 `toifood-back`) and PostgreSQL 16 (:5432); `jayagent` runs Ollama (:11434, `qwen2.5:7b`), reached over `127.0.0.1`. Bootstrap is `scripts/macmini-setup.sh` (idempotent: Homebrew → Node 22 via nvm → PostgreSQL 16 → clone → `.env` with generated JWT_SECRET → `prisma migrate deploy` → PM2).

**Stack & decisions.** Node/TypeScript, Express 4, Prisma 5 + PostgreSQL, JWT auth (`src/middleware/auth.ts`) with local + Google/Apple sign-in, `trust proxy` for tunnel IPs, CORS allowlist via `CORS_ORIGIN`. AI generation sits behind an `AIProvider` interface (`src/services/ai/provider.ts`) with three implementations — Ollama (default; JSON-format prompt, 65s timeout, in-process request queue, CJK-bleed stripping, `ollama-v5` prompt version), OpenAI, Claude — selected by `AI_PROVIDER` (`src/services/ai/index.ts`). Region/continent is picked server-side from a curated `COUNTRY_REGIONS` table; emoji inferred from a keyword table.

**Route versioning (migration in progress).** All routers are mounted under `/1-1-6/` (`/1-1-6/auth`, `/1-1-6/api/*`, `/1-1-6/system/*`) with bare legacy paths kept alive for old app builds (`src/index.ts`). `/app-config` serves `minVersion` (default `1.1.6`) as the client force-update signal. Public `/stats` returns rounded counts with a 60s in-memory cache.

**Rate limiting.** Role-based daily caps in Redis (`src/middleware/rateLimit.ts`): free 3 ollama / 2 claude, premium 10/5, admin bypass. Atomic Lua INCR+EXPIRE (24h window); fails open with a warning if Redis is down. Usage surfaced via `getRecipeUsage`.

**Schema state (as of migration `20260703000000_remove_flows_model`).** 12 models: User (role enum `free|premium|admin` replaced `isPremium`; continent prefs, profile visibility JSON, age/gender added 2026-05-31), Recipe (share tokens, OG image bytes, provider/style/mealType/pantryUsed/cookTime/continent), RecipeReview, SavedList/SavedListItem (replaced Favourite, dropped 2026-04-14), DietaryPreference, PantryItem, UserInsight (history-style since `20260614`, status column removed `20260702`), CookRecord (STARTED/COMPLETED/ABANDONED lifecycle with ingredient/pantry/grocery snapshots, added 2026-05-31), password-reset + email-verification tokens. The flow system (added 2026-04-15) was fully removed 2026-07-03.

**Ops & observability.** Slack Socket-Mode bot (`src/slack-bot.ts`) in `#toifood-ops` answers `!status`/`!logs`/`!metrics` via PM2. Daily digest (`src/digest.ts`) aggregates per-provider recipe metrics (response time, pantry/grocery match %, fallbacks) from `would/*.csv` and posts to a Google Chat webhook, logging outcomes to `DIGEST-METRIC.csv`. Per-request logging middleware records method/path/status/latency/userId. Store metrics routes plus `src/services/appstore.ts`/`playstore.ts`/`youtube.ts` pull external channel data; `src/storeReport.ts` renders reports with `@napi-rs/canvas`.
