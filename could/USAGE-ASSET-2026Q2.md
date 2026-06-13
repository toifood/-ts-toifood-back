ASSET LOG - USAGE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:usage {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Monitoring hooks, structured logging, observability coverage

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:usage 2026-06-13 17:04 → Metric schemas, cook record model, and Redis key inventory

**RECIPE-METRIC.csv** — `src/routes/recipes.ts:119-158`
Key analytics columns: usedProvider, fallback, responseMs, pantryPct, groceryPct, promptVersion, continent

**DISCOVER-METRIC.csv** — `src/routes/recipes.ts:122-138`
Columns: pantrySize, resultCount, avgPantryPct, avgGroceryPct

**DIGEST-METRIC.csv** — `src/digest.ts:47-86`
Columns: ollamaRecipes, claudeRecipes, avgResponseMs, wiredMb, usableMb, ollamaStatus

**CookRecord fields** (schema.prisma):
status: STARTED | COMPLETED | ABANDONED, ingredientCount, pantryCount, groceryCount, startedAt, completedAt

**Redis key inventory:**
- `ratelimit:{userId}:ollama` — 1hr TTL, atomic Lua INCR+EXPIRE
- `ratelimit:{userId}:claude` — 1hr TTL
- `insights:cooldown:{userId}` — 7-day TTL

**Stats endpoint** (`src/index.ts:72-87`):
60s in-memory cache; returns `recipesGenerated` and `cooksJoined` rounded to nearest 10
## ASSET:usage 2026-06-09 18:16 â†’ CookStatus funnel data is the foundation for completion-rate analytics; Recipe.provider + CookRecord join enables full AI cost-to-cook attribution; error code field on all responses enables client-side telemetry segmentation

**CookStatus funnel as product health signal:**
- Every cook session has a terminal state: COMPLETED or ABANDONED. `CookRecord` rows are the raw data for the core product metric â€” recipe-to-cook conversion rate. The data model is already in place; only an aggregation endpoint (or a periodic SQL query in digest.ts) is needed to surface it.
- `CookRecord.pantryCount` / `CookRecord.ingredientCount` ratio is the direct indicator of the app's pantry-awareness value: what fraction of recipe ingredients users already own. This is a differentiating metric unique to this app's value proposition.

**Structured error codes enable client-side telemetry:**
- All error responses include a `code` field (30+ distinct values across 8 routes). Mobile clients can log these codes to their own analytics pipeline (e.g., Amplitude, Mixpanel) to build a structured error-rate breakdown by code without needing server-side changes. This decouples error observability from server log availability.

**AppStore/PlayStore metrics as crash proxy:**
- `GET /store-metrics` returns 30-day crash rate (AppStore) and 7-day crash/ANR rate (PlayStore). These are lagging indicators of backend-induced crashes visible before any user complaint reaches support. Admin monitoring of this endpoint can catch regressions introduced by backend deployments within days.

## ASSET:usage 2026-06-09 18:03 â†’ CookRecord JSON fields (ingredients/pantryItems/groceryItems) enable per-session ingredient analytics; Recipe.provider enables AI cost attribution; Redis quota state exposed to clients

**Per-session ingredient data:**
- Each CookRecord stores the full ingredient array split into pantryItems and groceryItems at time of cook â€” this enables future analytics like "average pantry utilisation rate" (pantryCount / ingredientCount) per user or cohort, which is a direct product health metric for the app's core value proposition.
- `servings` override is recorded per session â€” allows comparison of recipe default servings vs. actual servings cooked, useful for recipe quality tuning.

**AI cost attribution via Recipe.provider:**
- `Recipe.provider` field (ollama / openai / claude) stored on every generated recipe â€” this is the foundation for any future cost breakdown analysis. Joining Recipe with CookRecord allows "total AI cost attributed to cooks" vs. "AI cost for abandoned recipes."

**Redis quota transparency:**
- `GET /recipes/usage` returns `{ollama: {used, max, ttl}, claude: {used, max, ttl}}` per authenticated user â€” the client can show a live usage gauge without polling. This reduces user confusion about why generation fails and lowers support burden.
- Rolling 1-hour window counters mean quota resets predictably â€” no permanent quota exhaustion.

**Store metrics available on demand:**
- AppStore 30-day installs, sessions, active devices, crash rate; PlayStore 7-day crash/ANR rate â€” available at `GET /store-metrics` for admin users without requiring a separate analytics dashboard subscription.
## ASSET:usage 2026-06-07 16:30 â†’ CookRecord now persists full cook session data (ingredients, pantry/grocery split, servings, status); AppStore + PlayStore metrics polling in place

**CookRecord data model (new in 1-1-1):**
- Per-session: `ingredientCount`, `pantryCount`, `groceryCount` counters for quick aggregation
- Full ingredient arrays (`ingredients`, `pantryItems`, `groceryItems`) stored as JSON for detailed replay
- `servings` override recorded (user may adjust from recipe default)
- `CookStatus` lifecycle: STARTED â†’ COMPLETED or ABANDONED â€” enables funnel analysis

**Store metrics (`src/services/appstore.ts`, `src/services/playstore.ts`):**
- AppStore: 30-day installs, sessions, active devices, crashes via App Store Connect API (ES256 JWT auth)
- PlayStore: 7-day crash rate, ANR rate via Google Play Developer Reporting API (service account)
- Both services return `null` gracefully if credentials are absent â€” no crash on unconfigured environments

**Recipe usage tracking:**
- `GET /recipes/usage` exposes per-user Redis quota state (used/max/ttl) for both Ollama and Claude providers
- `provider` field on Recipe model records which AI generated each recipe â€” enables provider usage analysis per user

**Request-level logging:**
- Every HTTP request logs method, path, status code, latency, and userId â€” structured for log grep/analysis
## ASSET:usage 2026-06-07 10:00 â†’ Usage tracking: request middleware logs, Redis quota counters, /stats + /recipes/usage endpoints, Slack alerts

**Request logging** (`src/index.ts`):
- Every request logged: `[req] METHOD PATH STATUS DURATIONms userId=X`
- Captures anonymous (`anon`) vs. authenticated user requests

**Quota tracking** (`src/middleware/rateLimit.ts`):
- Redis counters: `ratelimit:{userId}:ollama` and `ratelimit:{userId}:claude` â€” rolling 1-hour window
- `getRecipeUsage(userId)` returns `{ ollama: {used, max, ttl}, claude: {used, max, ttl} }`
- Exposed via `GET /recipes/usage` (authenticated)

**Public stats** (`src/index.ts`):
- `GET /stats` â€” `{ recipesGenerated: <rounded>, cooksJoined: <rounded> }`, 60s cache
- `GET /app-config` â€” `{ minVersion: "1.0.6" }` â€” used for mobile force-upgrade gate

**Event-based Slack alerts** (`src/lib/chat.ts`):
- Apple auth failures, recipe generation errors â†’ Slack via `chatAlert()`
- `src/slack-bot.ts` â€” separate Slack bot process
- `src/digest.ts` â€” separate digest process (likely periodic summary)

**Onboarding tracking:**
- `UserFlowView` table: records which flows each user has viewed/completed, with `skippedSteps[]` and `responses` JSON
- `GET /admin/flows` returns view count per flow (`_count: { views: true }`)
