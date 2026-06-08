ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:analysis 2026-06-08 10:00 → Zero tests, monolithic routes, legacy route debt, and no request correlation ID unchanged; 5 bugs fixed but structural risks remain

**Bug fixes improved code safety but did not change architecture.** The same structural concerns from Q2 carry into Q3:

- **No test suite** — zero test files. No unit, integration, or e2e tests. The bug-fix round was applied manually by inspecting logs and code; there is no regression harness to verify fixes held or detect new breaks. This remains the single largest quality risk.
- **Monolithic route files** — `src/routes/recipes.ts` handles OG image generation, YouTube search, AI recipe generation, pantry matching, insight triggering, rate limiting, and CRUD in one file. Any change to recipe generation risks breaking unrelated features.
- **AI insight trigger unknown** — `runInsightAnalysis()` location and trigger condition is unclear at the route level. No cron, no queue, no explicit call site documented.
- **Legacy route maintenance debt** — versioned (`/1-1-1/`) and unversioned routes mount the same router instances; a bug fix or behaviour change in a shared router silently affects both API versions.
- **No request correlation ID** — logs use `userId` but no per-request ID; debugging a multi-step failure across auth → rate check → AI → DB write → OG image → YouTube requires manual timestamp correlation.
- **Prisma connection pool unconfigured** — PrismaClient instantiated with default pool settings; under concurrent recipe generation (each hitting DB multiple times), connection exhaustion is possible at scale.