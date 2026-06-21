ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Clean AIProvider abstraction, atomic Redis rate limiting, and fire-and-forget insight pipeline are well-designed
## ASSET:analysis 2026-06-22 11:51 → Architecture snapshot: Express + Prisma + Ollama on Mac mini M4

| Layer | Detail |
|---|---|
| Runtime | Node.js + TypeScript, managed by PM2 |
| API | Express.js with 11 route modules, all registered at both `/1-1-1/` and legacy bare paths |
| DB | PostgreSQL via Prisma ORM; 20 migration files (March–June 2026) |
| AI providers | Ollama (qwen2.5:7b, default, 65s timeout, serial queue), Claude Haiku 4.5 (fallback-capable, 30s timeout), OpenAI GPT-4o (stub, unused) |
| Rate limiting | Redis-backed per-user per-provider hourly limits: free=3 ollama/2 claude, premium=10/5, admin=unlimited |
| Auth | JWT (7d expiry), email+password (bcrypt), Google OAuth, Apple Sign-In (JWKS-verified) |
| Notifications | Google Chat webhook (alerts + daily digest), Slack bolt (socket mode, ops commands) |
| External APIs | YouTube Data API v3 (recipe video lookup), App Store Connect API, Play Developer Reporting API, GitHub API (auth metric push) |
| Storage | Local CSV files (`would/`) for metrics; OG images stored as `Bytes` in PostgreSQL |
| Insights | 5-category AI insight analysis per user weekly (dietary, cuisine, style, pantry, mealType) via local Ollama |

**AIProvider interface** (`src/services/ai/provider.ts`) — Ollama, Claude, and OpenAI all implement a single `generateRecipe(request): Promise<GenerateRecipeResult>` contract. Swapping providers is a one-line env change. Shared helpers (`pickRegion`, `buildStyleInstruction`, `buildPantryLine`, `buildMealTypeLine`, `extractFoodEmoji`) are correctly colocated in `provider.ts`.

**Atomic Redis Lua rate limiting** — `rateLimit.ts` uses a Lua script to `INCR` and conditionally `EXPIRE` in a single atomic operation, preventing the race where two concurrent requests both see count=1 and the TTL is never set. Redis failure degrades gracefully (warning logged, request allowed through).

**Insight pipeline** — `runInsightAnalysis` is called fire-and-forget after recipe save. Redis cooldown key (`insights:cooldown:{userId}`, 7-day TTL) prevents re-running analysis on every save. Five analysis dimensions (dietary, cuisine, style, pantry, mealType) run in parallel via `Promise.allSettled` so one failure doesn't block others.

**OG image caching** — Images are generated once at recipe generate time and stored as `Bytes` in the DB. The `/public/:token/og-image` endpoint serves from DB on cache hit; falls back to a pre-generated placeholder for legacy recipes. No per-request rendering.

**Apple JWKS caching** — 1hr in-memory TTL on Apple public keys avoids repeated external calls on every Apple Sign In. Node native `crypto.createPublicKey` used for verification — no third-party library needed.
