ASSET LOG - PRICE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:price {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
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
