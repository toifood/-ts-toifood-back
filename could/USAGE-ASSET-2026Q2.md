ASSET LOG - USAGE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:usage {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
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
