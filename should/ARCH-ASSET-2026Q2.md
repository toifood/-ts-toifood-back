SHOULD ASSET LOG
prompt: review and update architecture patterns, service boundaries, infrastructure decisions, dependency graph
path: should/ARCH-ASSET-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:ARCH {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:ARCH 2026-06-28 18:28 ▸ Clean AI provider abstraction, Cloudflare Tunnel edge, and role-based rate limiting with atomic Redis increment
## ASSET:ARCH 2026-06-29 06:28 ▸ Insights AI service: Ollama-first with 8s timeout and deterministic fallback; DB-authoritative admin guard; storeMetrics 1hr in-memory cache with error pass-through

**Insights AI service design** (`src/services/ai/insights.ts`): Five insight categories (dietary, cuisine, style, pantry, mealType) each run independent analysis functions. Ollama (`qwen2.5:7b`) is used with an 8-second `AbortController` timeout per call; on failure or timeout, a deterministic fallback string is returned — insights analysis never blocks or errors. Results are upserted with `findFirst + update-in-place` for existing pending insights.

**DB-authoritative admin role check** (`src/routes/admin.ts`): `requireAdmin()` queries the `User` table on every request rather than trusting a role claim in the JWT. This ensures role changes (e.g. demoting an admin) take effect immediately without token invalidation. The tradeoff is one extra DB query per admin action.

**StoreMetrics in-memory cache** (`src/routes/storeMetrics.ts`): App Store and Play Store metrics are cached in memory for 1 hour. The cache is returned on hit without re-fetching — appropriate given store metrics have a 24-48h publication delay. Cache does not survive process restarts.

**Insights dismissed-category exclusion**: `runInsightAnalysis` fetches `dismissed` insights from the last 7 days and excludes those categories from the current analysis run. This prevents re-surfacing insights the user has explicitly rejected within a week.

**AI provider abstraction** (`src/services/ai/index.ts`, `provider.ts`): `AIProvider` interface with three concrete implementations — Ollama (default), OpenAI, Claude. Switched via `AI_PROVIDER` env var. Claude provider targets `claude-haiku-4-5-20251001` at `PROMPT_VERSION=claude-v5`. Emoji extraction and region/continent selection are shared utilities in `provider.ts`, ensuring consistent behaviour across all providers.

**Cloudflare Tunnel ingress**: `app.set("trust proxy", 1)` in `src/index.ts` reflects that all traffic arrives via Cloudflare Tunnel — no port is directly exposed. This gives zero-trust edge with automatic TLS and the ability to re-route to a new host without DNS propagation delays.

**Versioned API path `/1-1-1/`**: Current clients target `/1-1-1/auth`, `/1-1-1/api/...`, `/1-1-1/system/...`. Legacy unversioned paths remain mounted for 1-1-0 builds. This provides a clean phased migration path for mobile app releases.

**Redis atomic rate limiting** (`src/middleware/rateLimit.ts`): Lua script (`INCR` + `EXPIRE` in one atomic call) prevents the race condition where concurrent requests both observe count=1 and the key never receives an expiry. Role tiers — free (ollama:3/hr, claude:2/hr), premium (ollama:10/hr, claude:5/hr), admin (unlimited).

**Structured request logging**: All requests log `[req] METHOD path status ms userId=` on finish. Provides basic observability without an external APM dependency.

**Cascade deletes**: User-owned models (PantryItem, SavedList, SavedListItem, UserFlowView, CookRecord, UserInsight) all declare `onDelete: Cascade` — safe user deletion without orphan cleanup logic.

**Process resilience**: `unhandledRejection` and `uncaughtException` handlers in `src/index.ts` log and survive unexpected errors rather than crashing silently.
