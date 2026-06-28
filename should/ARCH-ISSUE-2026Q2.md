SHOULD ISSUE LOG
prompt: review and update architecture patterns, service boundaries, infrastructure decisions, dependency graph
path: should/ARCH-ISSUE-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:ARCH {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:ARCH 2026-06-28 18:28 ▸ Dual-route registration has no deprecation timeline; Redis single-point-of-failure bypasses rate limits on outage
## ISSUE:ARCH 2026-06-29 06:28 ▸ Duplicate Redis connections per process; requireAdmin performs uncached DB lookup on every admin request; business logic embedded in route handler

**Two independent Redis connections**: `src/services/ai/insights.ts` instantiates `new Redis(...)` at module load, separate from the `new Redis(...)` in `src/middleware/rateLimit.ts`. Two live connections to the same Redis server from a single Node.js process — no shared connection pool, no coordinated error handling.

**requireAdmin: uncached DB query per request**: `src/routes/admin.ts` `requireAdmin()` calls `prisma.user.findUnique` on every admin endpoint hit to fetch the user's role. The JWT payload does not include a role claim, so every admin action incurs a DB round-trip. Under load or during DB degradation, admin endpoints become slower proportionally.

**Ingredient stemming logic in handler**: `src/routes/cookRecords.ts` embeds `pluralStem()` and `stemMatch()` directly in the route file. This pantry-matching algorithm is specific business logic that should be in a service or utility module to enable reuse (e.g. for insights pantry analysis) and testing in isolation.

**Insights Redis `enableOfflineQueue: false`**: The insights Redis client disables the offline queue. If Redis is unavailable at analysis time, the cooldown key set is skipped silently — `already === null` check cannot distinguish "already set" from "Redis error", potentially running duplicate analyses during a Redis flap.

**Legacy route exposure**: `src/index.ts` registers every route twice — once under `/1-1-1/...` (current) and once at bare paths (`/auth`, `/recipes`, `/users`, etc.) kept "until old builds phase out". No sunset date is defined and no mechanism enforces retirement. Old clients on 1-1-0 builds can call unversioned paths indefinitely, preventing clean removal.

**Redis failover gap**: `src/middleware/rateLimit.ts` logs a warning and calls `next()` when Redis is unavailable. This means any Redis outage silently disables all per-user rate limiting, allowing free and premium users to generate unlimited recipes via Ollama or Claude until Redis recovers. The fail-open choice was intentional but is undocumented as an accepted risk.

**JWT without rotation**: `src/middleware/auth.ts` issues JWT tokens with no refresh-token flow. Tokens are long-lived (expiry set at issue time only). A compromised token remains valid until expiry; there is no revocation mechanism.

**Health endpoint blind spots**: `GET /health` returns `{status:"ok"}` unconditionally — it does not probe Prisma or Redis. A cold-start failure or DB disconnect will still return 200, masking incidents from uptime monitors.

**`dump.rdb` committed to repo**: The Redis RDB dump file appears in the repo root. It should be gitignored; if it contains user session keys it represents a data-exposure risk in the repository history.

**Shared package coupling**: `shared/` is a local file dependency (`shared/src/index.ts`) with no versioning. Schema changes to shared types (e.g. `GenerateRecipeRequest`) silently break build parity between back and front without a semver contract.
