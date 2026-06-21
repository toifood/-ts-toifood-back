ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Clean AIProvider abstraction, atomic Redis rate limiting, and fire-and-forget insight pipeline are well-designed

**AIProvider interface** (`src/services/ai/provider.ts`) — Ollama, Claude, and OpenAI all implement a single `generateRecipe(request): Promise<GenerateRecipeResult>` contract. Swapping providers is a one-line env change. Shared helpers (`pickRegion`, `buildStyleInstruction`, `buildPantryLine`, `buildMealTypeLine`, `extractFoodEmoji`) are correctly colocated in `provider.ts`.

**Atomic Redis Lua rate limiting** — `rateLimit.ts` uses a Lua script to `INCR` and conditionally `EXPIRE` in a single atomic operation, preventing the race where two concurrent requests both see count=1 and the TTL is never set. Redis failure degrades gracefully (warning logged, request allowed through).

**Insight pipeline** — `runInsightAnalysis` is called fire-and-forget after recipe save. Redis cooldown key (`insights:cooldown:{userId}`, 7-day TTL) prevents re-running analysis on every save. Five analysis dimensions (dietary, cuisine, style, pantry, mealType) run in parallel via `Promise.allSettled` so one failure doesn't block others.

**OG image caching** — Images are generated once at recipe generate time and stored as `Bytes` in the DB. The `/public/:token/og-image` endpoint serves from DB on cache hit; falls back to a pre-generated placeholder for legacy recipes. No per-request rendering.

**Apple JWKS caching** — 1hr in-memory TTL on Apple public keys avoids repeated external calls on every Apple Sign In. Node native `crypto.createPublicKey` used for verification — no third-party library needed.
