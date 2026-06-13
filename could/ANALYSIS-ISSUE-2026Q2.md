ISSUE LOG - ANALYSIS
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:analysis {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Technical debt, tight coupling, missing abstraction, scalability concerns

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:analysis 2026-06-09 18:16 â†’ Three Node.js processes (API + digest + slack-bot) share one PostgreSQL instance with unconfigured connection pools; no test suite means every deploy is production-first validation; shared router instances undermine API versioning

**Multi-process PostgreSQL connection pool contention:**
- `src/index.ts` (main API), `src/digest.ts`, and `src/slack-bot.ts` each instantiate their own `PrismaClient` with no explicit `connection_limit`. Prisma's default connection pool is `min(num_cpus * 2 + 1, 10)` per client instance. Three processes on the same Mac mini M4 (8 CPUs) each holding up to 17 connections = up to 51 concurrent connections to one PostgreSQL instance. Under simultaneous digest cron execution + active user traffic + slack-bot DB queries, this pool contention will surface as `P2024` (connection pool timeout) errors before the Mac mini saturates CPU or RAM.

**Zero tests = production is the test environment:**
- No test suite exists (no test files, no test runner config, no CI test step). Every code change â€” including the 5 bug fixes in the 1-1-1 round â€” was validated entirely by running in production and observing behaviour or user reports. There is no regression harness. A new developer fixing one bug cannot verify they haven't introduced another. This is the single largest architectural risk for the codebase at any scale.

**Shared router instances make versioning illusory:**
- Both `/api/recipes` and `/1-1-1/api/recipes` mount the same `router` instance from `src/routes/recipes.ts`. A bug fix in recipes.ts changes the behaviour of both the versioned and unversioned paths simultaneously. The versioning prefix communicates API stability to clients but provides no actual isolation â€” it is a naming convention, not an architectural boundary.

## ISSUE:analysis 2026-06-09 18:03 â†’ Synchronous CPU work in request path (canvas OG image, pluralStem matching) blocks event loop; no correlation IDs; recipes.ts doing too many jobs; AI service has no circuit breaker

**Synchronous CPU work blocks the event loop:**
- `@napi-rs/canvas` OG image generation runs synchronously in the recipe save request handler. Canvas is CPU-bound; on the Mac mini M4 with a single Node.js thread, a slow canvas render (e.g., complex font layout) blocks all other requests for its duration. At scale, this is the primary throughput bottleneck.
- `pluralStem()` loop in `cookRecords.ts` iterates over all recipe ingredients Ã— all pantry items per cook record creation â€” O(nÃ—m) per request. For a recipe with 20 ingredients and a user with 50 pantry items, this is 1,000 string comparisons on every cook start.

**No correlation / request IDs:**
- HTTP request logs contain userId and path but no per-request UUID. When debugging a failure that spans rate-limit check â†’ AI call â†’ DB write â†’ OG image â†’ YouTube lookup, log lines cannot be unambiguously correlated without matching timestamps manually. Any concurrent requests by the same user create ambiguous log sequences.

**recipes.ts handles too many concerns:**
- Recipe generation, OG image creation, YouTube search, pantry matching, insight triggering, rate limiting, and CRUD are all in one route file. This creates high coupling: adding a feature to recipe generation risks breaking OG image logic, pantry matching, or insight analysis in the same file. Splitting into services (recipe generation, media, analytics) would isolate change risk.

**AI service has no circuit breaker:**
- `getAIProvider()` calls the AI backend (Ollama/OpenAI/Claude) with no circuit breaker, timeout, or retry limit at the service layer. If Ollama becomes unresponsive (not down, just slow), all recipe generation requests hang indefinitely. Node.js has a default socket timeout of ~2 minutes â€” users wait that long before seeing an error.

**No staging / preview environment documented:**
- All deployment docs reference the Mac mini M4 production instance. There is no documented staging environment. Code changes go straight to production, with no pre-production validation layer.
## ISSUE:analysis 2026-06-07 16:30 â†’ No test suite; monolithic route files; AI insight trigger unknown; no DB connection pooling config; legacy routes create maintenance debt

**No tests:**
- Zero test files found in the repo. No unit, integration, or e2e tests. For a production app handling user data, auth flows, and AI-generated content, this is the single largest quality risk. Any refactor or migration is untested.

**Monolithic route files:**
- `src/routes/recipes.ts` contains OG image generation, YouTube search, AI recipe generation, pantry matching, insight analysis triggering, rate limiting, and CRUD â€” all in one file. This is significant complexity in a single module; any change to recipe generation risks breaking unrelated features.

**AI insight trigger unknown:**
- `runInsightAnalysis()` is imported in recipes.ts but not obviously triggered on a fixed event. If it is conditionally called deep in recipe generation logic, it may fire unpredictably. No cron, no queue, no explicit trigger point visible at the route level.

**Prisma without explicit connection pool config:**
- `src/lib/prisma.ts` instantiates PrismaClient with no `datasourceUrl` override or connection pool tuning. Under concurrent recipe generation (each hitting DB for user lookup, rate limit check, recipe save, insight save, OG image save), connection exhaustion is possible on a single Mac mini.

**Legacy route maintenance debt:**
- Both versioned (`/1-1-1/`) and unversioned routes mount the same router instances â€” any bug or behavior change in a shared router affects both API versions simultaneously, which undermines the point of versioning.

**No request ID / correlation ID:**
- Logs use `userId` but no per-request ID. Debugging a multi-step failure (auth â†’ rate check â†’ AI â†’ DB write â†’ OG image â†’ YouTube) across log lines requires manual timestamp correlation.
