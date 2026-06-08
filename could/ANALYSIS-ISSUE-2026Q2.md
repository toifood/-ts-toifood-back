ISSUE LOG - ANALYSIS
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:analysis {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:analysis 2026-06-07 16:30 → No test suite; monolithic route files; AI insight trigger unknown; no DB connection pooling config; legacy routes create maintenance debt

**No tests:**
- Zero test files found in the repo. No unit, integration, or e2e tests. For a production app handling user data, auth flows, and AI-generated content, this is the single largest quality risk. Any refactor or migration is untested.

**Monolithic route files:**
- `src/routes/recipes.ts` contains OG image generation, YouTube search, AI recipe generation, pantry matching, insight analysis triggering, rate limiting, and CRUD — all in one file. This is significant complexity in a single module; any change to recipe generation risks breaking unrelated features.

**AI insight trigger unknown:**
- `runInsightAnalysis()` is imported in recipes.ts but not obviously triggered on a fixed event. If it is conditionally called deep in recipe generation logic, it may fire unpredictably. No cron, no queue, no explicit trigger point visible at the route level.

**Prisma without explicit connection pool config:**
- `src/lib/prisma.ts` instantiates PrismaClient with no `datasourceUrl` override or connection pool tuning. Under concurrent recipe generation (each hitting DB for user lookup, rate limit check, recipe save, insight save, OG image save), connection exhaustion is possible on a single Mac mini.

**Legacy route maintenance debt:**
- Both versioned (`/1-1-1/`) and unversioned routes mount the same router instances — any bug or behavior change in a shared router affects both API versions simultaneously, which undermines the point of versioning.

**No request ID / correlation ID:**
- Logs use `userId` but no per-request ID. Debugging a multi-step failure (auth → rate check → AI → DB write → OG image → YouTube) across log lines requires manual timestamp correlation.
