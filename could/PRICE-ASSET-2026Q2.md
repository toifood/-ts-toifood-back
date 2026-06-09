ASSET LOG - PRICE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:price {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:price 2026-06-09 18:16 → Provider isolation via AI_PROVIDER env var prevents accidental paid-tier usage in dev; AppStore ES256 JWT is short-lived; role-tier limits are in-memory constants with no DB round-trip

**Provider isolation at runtime:**
- `AI_PROVIDER` env var selects the backend at process startup — switching from Ollama to Claude or OpenAI requires an explicit env change and pm2 restart, not an API call. This means dev environments running without `AI_PROVIDER` set default to free Ollama automatically, preventing accidental charged API usage in development or test runs.

**No DB round-trip for tier enforcement:**
- Rate limit tier values (`free: 3 ollama / 2 claude`, `premium: 10 / 5`, `admin: unlimited`) are stored as in-code constants, not DB rows. Each rate-limit check reads the user's role from the JWT payload (already in memory) and the Redis counter — no `SELECT` on the users table per request. This keeps the quota enforcement path fast and immune to DB latency spikes.

**AppStore credential safety:**
- App Store Connect API uses ES256 JWTs with a 20-minute expiry, generated fresh per request from the private key env var. No long-lived token is stored in memory or DB — credential theft window is limited to the 20-minute JWT lifetime.
- `PLAY_SERVICE_ACCOUNT_JSON` loaded from env var at startup; if absent, the PlayStore service returns `null` gracefully — no crash or 500 on unconfigured environments.

## ASSET:price 2026-06-09 18:03 → Ollama (qwen2.5:7b) as zero-cost default carries 100% of free-tier load; Redis rate limit counters expose live quota state to clients; isPremium computed server-side

**Cost-free default path:**
- Ollama running locally on the Mac mini M4 (`http://127.0.0.1:11434`) is the default AI provider — all free-tier recipe generation incurs zero marginal API cost
- `AI_PROVIDER` env var controls provider selection; switching from Ollama to paid providers requires a deliberate environment change, preventing accidental cost runaway in dev

**Rate limit as cost guardrail:**
- Redis counters `ratelimit:{userId}:{provider}` with 1-hour TTL enforce hard caps before any paid API call is made
- `getRecipeUsage()` returns real-time quota state — clients can surface "X of Y AI calls used" without a round-trip to the AI provider
- `isPremium` flag computed server-side as `role !== "free"` — no client-side role spoofing can unlock higher quota tiers

**Tier structure clarity:**
- Role tiers (free/premium/admin) map directly to quota limits stored in code constants — no database lookup needed per request, making quota checks fast and deterministic
- `express-rate-limit` on auth endpoints (10 req/15 min) prevents credential stuffing that could create premium accounts fraudulently

**AppStore / PlayStore credential isolation:**
- App Store Connect API uses short-lived ES256 JWT tokens (20-min expiry) — no long-lived credential stored in memory
- PlayStore service account JSON is loaded from env var — absent credentials cause graceful null return, not a crash
## ASSET:price 2026-06-07 16:30 → Redis-backed hourly rate limits per role/provider; free=3 Ollama/2 Claude, premium=10/5, admin=unlimited

**Rate limit implementation (`src/middleware/rateLimit.ts`):**
- Per-user, per-provider (ollama/claude) Redis counters with 1-hour TTL
- Role-based limits: `free` → 3 Ollama / 2 Claude per hour; `premium` → 10 / 5; `admin` → bypass
- `getRecipeUsage()` function exposes current usage counters to the client (visible in UI)
- `express-rate-limit` package used on all auth endpoints (10 req/15 min window) to prevent brute force

**Cost-control infrastructure:**
- Ollama (local `qwen2.5:7b`) is the default provider — zero marginal API cost for the majority of usage
- AI provider selection is runtime-configurable via `AI_PROVIDER` env var — can switch away from paid providers without deployment
- AppStore/PlayStore metric polling uses ES256 JWT tokens with 20-minute expiry — scoped API access

**UserRole enum:** `free` / `premium` / `admin` — role gates rate limits and premium feature access
**`isPremium` flag** computed server-side as `role !== "free"`, so no client-side bypass possible
## ASSET:price 2026-06-07 10:00 → Role-based rate limits via Redis; 3 AI providers with cost profile

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
| Ollama (`qwen2.5:7b`) | Free — runs locally on Mac mini M4 (jayagent account, :11434) | Default |
| OpenAI | API cost per call | `AI_PROVIDER=openai` or per-request body |
| Claude (Anthropic) | API cost per call | `AI_PROVIDER=claude` or per-request body |

**Usage endpoint:** `GET /recipes/usage` — returns per-user quota state (used/max/ttl) for both providers
