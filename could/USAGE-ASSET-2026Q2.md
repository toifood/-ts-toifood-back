ASSET LOG - USAGE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:usage {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:usage 2026-06-09 18:03 → CookRecord JSON fields (ingredients/pantryItems/groceryItems) enable per-session ingredient analytics; Recipe.provider enables AI cost attribution; Redis quota state exposed to clients

**Per-session ingredient data:**
- Each CookRecord stores the full ingredient array split into pantryItems and groceryItems at time of cook — this enables future analytics like "average pantry utilisation rate" (pantryCount / ingredientCount) per user or cohort, which is a direct product health metric for the app's core value proposition.
- `servings` override is recorded per session — allows comparison of recipe default servings vs. actual servings cooked, useful for recipe quality tuning.

**AI cost attribution via Recipe.provider:**
- `Recipe.provider` field (ollama / openai / claude) stored on every generated recipe — this is the foundation for any future cost breakdown analysis. Joining Recipe with CookRecord allows "total AI cost attributed to cooks" vs. "AI cost for abandoned recipes."

**Redis quota transparency:**
- `GET /recipes/usage` returns `{ollama: {used, max, ttl}, claude: {used, max, ttl}}` per authenticated user — the client can show a live usage gauge without polling. This reduces user confusion about why generation fails and lowers support burden.
- Rolling 1-hour window counters mean quota resets predictably — no permanent quota exhaustion.

**Store metrics available on demand:**
- AppStore 30-day installs, sessions, active devices, crash rate; PlayStore 7-day crash/ANR rate — available at `GET /store-metrics` for admin users without requiring a separate analytics dashboard subscription.
## ASSET:usage 2026-06-07 16:30 → CookRecord now persists full cook session data (ingredients, pantry/grocery split, servings, status); AppStore + PlayStore metrics polling in place

**CookRecord data model (new in 1-1-1):**
- Per-session: `ingredientCount`, `pantryCount`, `groceryCount` counters for quick aggregation
- Full ingredient arrays (`ingredients`, `pantryItems`, `groceryItems`) stored as JSON for detailed replay
- `servings` override recorded (user may adjust from recipe default)
- `CookStatus` lifecycle: STARTED → COMPLETED or ABANDONED — enables funnel analysis

**Store metrics (`src/services/appstore.ts`, `src/services/playstore.ts`):**
- AppStore: 30-day installs, sessions, active devices, crashes via App Store Connect API (ES256 JWT auth)
- PlayStore: 7-day crash rate, ANR rate via Google Play Developer Reporting API (service account)
- Both services return `null` gracefully if credentials are absent — no crash on unconfigured environments

**Recipe usage tracking:**
- `GET /recipes/usage` exposes per-user Redis quota state (used/max/ttl) for both Ollama and Claude providers
- `provider` field on Recipe model records which AI generated each recipe — enables provider usage analysis per user

**Request-level logging:**
- Every HTTP request logs method, path, status code, latency, and userId — structured for log grep/analysis
## ASSET:usage 2026-06-07 10:00 → Usage tracking: request middleware logs, Redis quota counters, /stats + /recipes/usage endpoints, Slack alerts

**Request logging** (`src/index.ts`):
- Every request logged: `[req] METHOD PATH STATUS DURATIONms userId=X`
- Captures anonymous (`anon`) vs. authenticated user requests

**Quota tracking** (`src/middleware/rateLimit.ts`):
- Redis counters: `ratelimit:{userId}:ollama` and `ratelimit:{userId}:claude` — rolling 1-hour window
- `getRecipeUsage(userId)` returns `{ ollama: {used, max, ttl}, claude: {used, max, ttl} }`
- Exposed via `GET /recipes/usage` (authenticated)

**Public stats** (`src/index.ts`):
- `GET /stats` — `{ recipesGenerated: <rounded>, cooksJoined: <rounded> }`, 60s cache
- `GET /app-config` — `{ minVersion: "1.0.6" }` — used for mobile force-upgrade gate

**Event-based Slack alerts** (`src/lib/chat.ts`):
- Apple auth failures, recipe generation errors → Slack via `chatAlert()`
- `src/slack-bot.ts` — separate Slack bot process
- `src/digest.ts` — separate digest process (likely periodic summary)

**Onboarding tracking:**
- `UserFlowView` table: records which flows each user has viewed/completed, with `skippedSteps[]` and `responses` JSON
- `GET /admin/flows` returns view count per flow (`_count: { views: true }`)
