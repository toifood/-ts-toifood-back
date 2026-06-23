ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Rate limit structure, role hierarchy, and store metric fetchers are clean and stable
## ASSET:backend 2026-06-23 14:32 -> Pricing snapshot — role model, atomic Redis enforcement, app store validation present but not role-wired

**Role model (unchanged):**
```
enum UserRole { free | premium | admin }
User.role: UserRole @default(free)
```

**Rate limit enforcement (`src/middleware/rateLimit.ts`):**
- Redis key: `ratelimit:{userId}:{provider}` (TTL 3600s, reset per-hour window)
- Atomic increment via Lua eval: `INCR` + `EXPIRE` in single call — race-free
- Admin bypass: role fetched from DB before Lua eval; admins short-circuit to `next()`
- `getRecipeUsage(userId)` exported for `/users/me` usage display: returns `{ ollama: { used, max, ttl }, claude: { used, max, ttl } }`

**App store validation present but not role-wired:**
- `src/services/appstore.ts` — Apple receipt/subscription validation functions exist
- `src/services/playstore.ts` — Google Play purchase verification exists
- Neither file triggers `prisma.user.update({ data: { role: "premium" } })` — the IAP-to-role bridge is not implemented

**Usage endpoint:** `GET /1-1-1/api/users/me` returns `role`, `isPremium`, `isAdmin` alongside rate usage data for client-side display.
## ASSET:backend 2026-06-23 11:23 → Claude haiku (1024 tokens, temp 1.0, 30s); Ollama local (no API cost); per-user hourly Redis rate limits

- Claude: model=claude-haiku-4-5-20251001, max_tokens=1024, temperature=1.0, 30s AbortSignal timeout
- Ollama: model=qwen2.5:7b (env-configurable), num_predict=2000, temperature=0.9, num_ctx=8192, 65s timeout — runs locally, no API cost
- OpenAI: model=gpt-4o in OpenAIProvider but not wired to any live route (requires AI_PROVIDER=openai env var explicitly)
- YouTube: 1 search query per `findRecipeVideo` call; called at generate time + potentially at save; 5s timeout; free tier = 10,000 units/day
- Per-user hourly rate limits (Redis): free = 3 ollama / 2 claude; premium = 10 ollama / 5 claude; admin = unlimited
- Insights: Ollama only (no Claude cost); num_predict=60, 8s timeout
- Store metrics: AppStore Connect JWT (ES256) + Play Developer Reporting API — no per-call billing
- No Anthropic token usage captured; no daily spend tracker; no aggregate quota dashboard

---
## ASSET:backend 2026-06-22 20:06 -> Per-provider per-user Redis rate limits cleanly enforce the free/premium tier split with observable usage state

**Independent per-provider rate limit keys (`src/middleware/rateLimit.ts:2779`)**
Keys are namespaced `ratelimit:{userId}:{ollama|claude}` — Ollama and Claude quotas are tracked and exhausted independently. A free user's 3 Ollama uses and 2 Claude uses are metered separately, matching the product intent. The separation means premium upgrade can increase only the relevant provider cap without touching the other.

**`getRecipeUsage` export makes quota state observable without side effects**
`GET /recipes/usage` calls `getRecipeUsage(userId)`, which reads Redis counters without incrementing them. The client can display remaining uses to the user before they attempt a generation, reducing frustration from unexpected 429s.

**`LIMITS` object isolates tier configuration in one place**
All tier thresholds are defined in a single `LIMITS` constant at the top of `rateLimit.ts`. Adding a new tier or changing quota numbers requires one line. The fallback `LIMITS[role] ?? LIMITS.free` ensures an unknown role receives the most restrictive limits — a safe default.
## ASSET:price 2026-06-22 11:51 → Cost exposure snapshot June 2026

| Service | Usage pattern | Cost type | Risk level |
|---|---|---|---|
| Claude Haiku 4.5 | Up to 2/hr (free), 5/hr (premium) per user | Pay-per-token (~$0.002/recipe) | Low — rate-limited |
| Ollama qwen2.5:7b | Up to 3/hr (free), 10/hr (premium) per user | Self-hosted Mac mini M4 | Zero marginal cost |
| YouTube Data API v3 | 1–2 calls per recipe generate+save (100 units each) | Free tier 10k units/day quota | Medium — quota exhaustion risk |
| GitHub API | 2 calls per external auth event (login/register) | Free tier rate limit | Low-Medium — rate limit risk at scale |
| PostgreSQL | OG images stored as Bytes (~200–500KB each) | Storage/WAL overhead | Medium — grows unbounded |
| Redis | Rate limiting + insight cooldowns | Self-hosted | Zero marginal cost |
| Gmail SMTP | Password reset + email verification | Free for low volume | Low |

**LIMITS object** in `rateLimit.ts` is the single source of truth for per-role per-provider quotas. Adding a new tier (e.g., `enterprise`) requires only adding a key to `LIMITS` and a corresponding `UserRole` enum value.

**Store metric fetchers:**
- `getAppStoreMetrics()` — fetches installs, sessions, activeDevices, crashes from App Store Connect API v1 for last 30 days. Returns `null` if any of the 4 required env vars is absent. Errors per-metric are caught individually (returns `null` for that metric).
- `getPlayStoreMetrics()` — fetches crash rate and ANR rate from Play Developer Reporting API (7-day window) using service account JSON. `installs30d` and `activeDevices30d` are explicitly `null` (require BigQuery export not available via API alone). Returns `null` if `PLAY_SERVICE_ACCOUNT_JSON` or `PLAY_PACKAGE_NAME` absent.

**`storeReport.ts` structure** (once paths are fixed) correctly separates the ISSUE entry (observations, flags for crashes > 10 or ANR > 0.5%) from the ASSET entry (raw metric table). This is the right pattern for separating signal from snapshot.
