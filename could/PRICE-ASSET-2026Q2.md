ASSET LOG - PRICE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:price {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Pricing logic correctness, audit trails, webhook idempotency

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:price 2026-06-13 18:11 → Role-tiered rate limiting correctly implemented with Redis atomicity

Rate limits are cleanly tiered by role in `src/middleware/rateLimit.ts`: `free` (3 ollama / 2 claude per hour), `premium` (10 / 5), `admin` (unlimited). A Redis Lua script (`INCR` + `EXPIRE` in one atomic call) prevents the race condition where two concurrent requests both see count=1 and the key never gets an expiry set. `getRecipeUsage()` exposes current used/max/TTL to clients so the frontend can display accurate quota status. The `isPremium` and `isAdmin` flags in `/users/me` are derived cleanly from `role` without separate boolean columns.
## ASSET:price 2026-06-13 17:04 → Claude call site, rate-limit config, and token response surface

**Model:** `claude-haiku-4-5-20251001` — hardcoded at `src/services/ai/claude.ts:59`

**Prompt version:** `claude-v4` (`src/services/ai/claude.ts:3`)

**max_tokens:** 1024 per call (`src/services/ai/claude.ts:60`)

**Timeout:** 30s AbortSignal (`src/services/ai/claude.ts:74`)

**Rate-limit config** (`src/middleware/rateLimit.ts:18-21`):
```
free:    { ollama: 3, claude: 2 }   // per hour
premium: { ollama: 10, claude: 5 }
admin:   { ollama: 999, claude: 999 }
```
Redis keys: `ratelimit:{userId}:claude`, `ratelimit:{userId}:ollama` — 1hr TTL

**Token usage surface:** `src/services/ai/claude.ts:85` — `data` from `response.json()` includes `usage` field; currently unused

**Caching opportunity:** add `anthropic-beta: prompt-caching-2024-07-31` header and wrap system string in `{ type: 'text', text: '...', cache_control: { type: 'ephemeral' } }`
## ASSET:price 2026-06-09 18:16 â†’ Provider isolation via AI_PROVIDER env var prevents accidental paid-tier usage in dev; AppStore ES256 JWT is short-lived; role-tier limits are in-memory constants with no DB round-trip

**Provider isolation at runtime:**
- `AI_PROVIDER` env var selects the backend at process startup â€” switching from Ollama to Claude or OpenAI requires an explicit env change and pm2 restart, not an API call. This means dev environments running without `AI_PROVIDER` set default to free Ollama automatically, preventing accidental charged API usage in development or test runs.

**No DB round-trip for tier enforcement:**
- Rate limit tier values (`free: 3 ollama / 2 claude`, `premium: 10 / 5`, `admin: unlimited`) are stored as in-code constants, not DB rows. Each rate-limit check reads the user's role from the JWT payload (already in memory) and the Redis counter â€” no `SELECT` on the users table per request. This keeps the quota enforcement path fast and immune to DB latency spikes.

**AppStore credential safety:**
- App Store Connect API uses ES256 JWTs with a 20-minute expiry, generated fresh per request from the private key env var. No long-lived token is stored in memory or DB â€” credential theft window is limited to the 20-minute JWT lifetime.
- `PLAY_SERVICE_ACCOUNT_JSON` loaded from env var at startup; if absent, the PlayStore service returns `null` gracefully â€” no crash or 500 on unconfigured environments.

## ASSET:price 2026-06-09 18:03 â†’ Ollama (qwen2.5:7b) as zero-cost default carries 100% of free-tier load; Redis rate limit counters expose live quota state to clients; isPremium computed server-side

**Cost-free default path:**
- Ollama running locally on the Mac mini M4 (`http://127.0.0.1:11434`) is the default AI provider â€” all free-tier recipe generation incurs zero marginal API cost
- `AI_PROVIDER` env var controls provider selection; switching from Ollama to paid providers requires a deliberate environment change, preventing accidental cost runaway in dev

**Rate limit as cost guardrail:**
- Redis counters `ratelimit:{userId}:{provider}` with 1-hour TTL enforce hard caps before any paid API call is made
- `getRecipeUsage()` returns real-time quota state â€” clients can surface "X of Y AI calls used" without a round-trip to the AI provider
- `isPremium` flag computed server-side as `role !== "free"` â€” no client-side role spoofing can unlock higher quota tiers

**Tier structure clarity:**
- Role tiers (free/premium/admin) map directly to quota limits stored in code constants â€” no database lookup needed per request, making quota checks fast and deterministic
- `express-rate-limit` on auth endpoints (10 req/15 min) prevents credential stuffing that could create premium accounts fraudulently

**AppStore / PlayStore credential isolation:**
- App Store Connect API uses short-lived ES256 JWT tokens (20-min expiry) â€” no long-lived credential stored in memory
- PlayStore service account JSON is loaded from env var â€” absent credentials cause graceful null return, not a crash
## ASSET:price 2026-06-07 16:30 â†’ Redis-backed hourly rate limits per role/provider; free=3 Ollama/2 Claude, premium=10/5, admin=unlimited

**Rate limit implementation (`src/middleware/rateLimit.ts`):**
- Per-user, per-provider (ollama/claude) Redis counters with 1-hour TTL
- Role-based limits: `free` â†’ 3 Ollama / 2 Claude per hour; `premium` â†’ 10 / 5; `admin` â†’ bypass
- `getRecipeUsage()` function exposes current usage counters to the client (visible in UI)
- `express-rate-limit` package used on all auth endpoints (10 req/15 min window) to prevent brute force

**Cost-control infrastructure:**
- Ollama (local `qwen2.5:7b`) is the default provider â€” zero marginal API cost for the majority of usage
- AI provider selection is runtime-configurable via `AI_PROVIDER` env var â€” can switch away from paid providers without deployment
- AppStore/PlayStore metric polling uses ES256 JWT tokens with 20-minute expiry â€” scoped API access

**UserRole enum:** `free` / `premium` / `admin` â€” role gates rate limits and premium feature access
**`isPremium` flag** computed server-side as `role !== "free"`, so no client-side bypass possible
## ASSET:price 2026-06-07 10:00 â†’ Role-based rate limits via Redis; 3 AI providers with cost profile

**Rate limit architecture** (`src/middleware/rateLimit.ts`):

| Role | Ollama/hr | Claude/hr |
|---|---|---|
| free | 3 | 2 |
| premium | 10 | 5 |
| admin | unlimited | unlimited |

- Limits tracked in Redis: key `ratelimit:{userId}:{provider}`, TTL 1 hour
- Per-request: checks user role from DB, increments Redis counter, returns 429 with `retryAfter` seconds if exceeded
- Redis: `ioredis` with offline queue disabled, exponential retry backoff `min(times*200, 2000)`

**AI provider cost profile:**

| Provider | Cost | Selection |
|---|---|---|
| Ollama (`qwen2.5:7b`) | Free â€” runs locally on Mac mini M4 (jayagent account, :11434) | Default |
| OpenAI | API cost per call | `AI_PROVIDER=openai` or per-request body |
| Claude (Anthropic) | API cost per call | `AI_PROVIDER=claude` or per-request body |

**Usage endpoint:** `GET /recipes/usage` â€” returns per-user quota state (used/max/ttl) for both providers
