SHOULD ASSET LOG
prompt: review and update disaster recovery procedures, rollback plans, backup strategies, incident response runbooks
path: should/RECOVERY-ASSET-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:RECOVERY {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:RECOVERY 2026-06-28 18:28 ▸ macmini-setup.sh provides repeatable environment bootstrap; Redis fail-open and Cloudflare Tunnel reduce recovery blast radius
## ASSET:RECOVERY 2026-06-29 06:28 ▸ Insights Redis configured with retryStrategy and offline-queue disabled; Ollama timeout + fallback ensures analysis never blocks; admin cache warms on first hit

**Insights Redis resilience config**: `src/services/ai/insights.ts` creates its Redis client with `enableOfflineQueue: false` and `retryStrategy: (times) => Math.min(times * 200, 2000)`. Disabling the offline queue prevents unbounded memory growth if Redis is down during a high-traffic period. The exponential backoff caps at 2 seconds per retry, limiting reconnection storm on Redis recovery.

**Ollama 8-second timeout with fallback**: Every `ollamaSuggest()` call is wrapped in an `AbortController` with 8-second timeout. On timeout or any fetch error, a deterministic pre-written fallback string is returned. This guarantees `runInsightAnalysis` completes in bounded time regardless of Ollama availability — insights are generated (potentially lower quality) rather than blocked.

**StoreMetrics lazy warm**: The storeMetrics in-memory cache warms on the first admin request after startup. No background job or preload is needed — store metrics are delayed 24-48h by the platforms anyway, so a brief post-restart cold period is acceptable.

**Insights analysis logging**: `runInsightAnalysis` logs `[insights] userId=... generated=N categories=...` on completion. This provides per-user observability for the analysis pipeline without an external APM dependency, consistent with the structured request logging in `src/index.ts`.

**`scripts/macmini-setup.sh` repeatable bootstrap**: Covers Homebrew, Node.js 22 (via nvm), PostgreSQL 16, and Redis installation in a single script. Provides a starting point for environment recreation after hardware replacement, though the hardcoded path and username need updating before reuse on a fresh machine.

**Redis fail-open rate limiting**: `src/middleware/rateLimit.ts` catches Redis errors and calls `next()` with a console warning rather than returning 500. This means a Redis outage degrades gracefully (rate limiting disabled) rather than taking down recipe generation entirely — appropriate given Redis is not the primary data store.

**Cloudflare Tunnel re-routing**: Because ingress arrives via Cloudflare Tunnel rather than direct DNS, recovering to a new host does not require waiting for DNS TTL propagation. The tunnel connector can be restarted on a new machine and pointed at the same origin, giving fast failover for the network layer.

**Stats endpoint cache fallback**: `src/index.ts` stats endpoint returns a stale cached value if the DB query fails, rather than 500. This preserves the public-facing marketing stat display during brief DB unavailability.

**Process crash handlers**: `unhandledRejection` and `uncaughtException` handlers log to stdout before the process continues or exits — ensuring crash causes are captured in whatever log sink the host uses.

**Prisma singleton client** (`src/lib/prisma.ts`): Single `PrismaClient` instance reused across requests prevents connection pool exhaustion during rapid restarts or test runs. In production, connection limits are managed by Prisma's built-in pooling.
