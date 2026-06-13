ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Pricing logic correctness, audit trails, webhook idempotency

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:price 2026-06-08 10:00 â†’ Atomic Lua rate limit now in place; Ollama zero-cost default; role-based limits unchanged; Apple JWKS cached

**Rate limit improvements since Q2:**
- INCR/EXPIRE is now atomic via Lua script â€” eliminates the race where two concurrent requests both saw `count===1` before either set the TTL

**Rate limit architecture (unchanged limits):**
| Role | Ollama/hr | Claude/hr |
|---|---|---|
| free | 3 | 2 |
| premium | 10 | 5 |
| admin | unlimited | unlimited |

**Cost-control assets:**
- Ollama (`qwen2.5:7b`, local Mac mini M4) is the default provider â€” zero marginal API cost for the majority of usage
- Apple JWKS keys now cached in-memory for 1 hour (`getCachedAppleKeys()`) â€” reduces external HTTP calls per auth event
- AI provider selection via `AI_PROVIDER` env var â€” switchable at runtime without deployment
- `GET /recipes/usage` exposes per-user quota state (used/max/ttl) to the client
- `isPremium` computed server-side â€” no client-side bypass possible