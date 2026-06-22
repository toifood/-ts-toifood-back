ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Rate limit structure, role hierarchy, and store metric fetchers are clean and stable
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
