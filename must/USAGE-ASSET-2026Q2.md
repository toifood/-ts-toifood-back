MUST ASSET LOG
prompt: Usage tracking implementation, rate limiting coverage, quota enforcement, metering status
path: must/USAGE-ASSET-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:USAGE 2026-06-29 06:25 ▸ Redis-backed role-based hourly quotas on recipe generation with atomic increment; usage status endpoint available

`src/middleware/rateLimit.ts` implements role-differentiated hourly quotas: free (3 ollama / 2 claude), premium (10 ollama / 5 claude), admin (unlimited bypass). Atomic Lua `INCR + EXPIRE` script prevents race-condition double-counting on first request. `getRecipeUsage()` helper exposes current used/max/ttl per provider for client display. `express-rate-limit ^8.3.2` installed for HTTP-level limiting. `ioredis` configured with `retryStrategy: times => Math.min(times * 200, 2000)` for reconnection resilience. Open gaps: insight AI calls unmetered, Redis-down bypass active, no HTTP-level rate limiting applied to non-AI routes.
