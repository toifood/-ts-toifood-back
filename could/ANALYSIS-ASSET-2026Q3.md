ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:analysis 2026-06-08 10:00 → 5 bugs fixed, error codes consistent across all routes; auth stack and architecture fundamentals unchanged; healthy for current scale

**Tech stack:** Node.js 18+ / TypeScript / Express / Prisma ORM / PostgreSQL / Redis / Ollama (`qwen2.5:7b`, local) / JWT + bcrypt / Passport (Local + Google + Apple)

**Improvements since Q2:**
- 5 production bugs fixed (JWKS cache, XSS escape, atomic rate limit, void promise, stemMatch)
- Error codes (`code` field) added to all error responses — 30+ distinct codes across 8 routes; API is now unambiguous for frontend error handling
- Pantry cap increased 30 → 50 items

**Core strengths (unchanged):**
- Full TypeScript with shared types in `shared/src/index` — no implicit any
- Multi-provider AI: Ollama/OpenAI/Claude factory with runtime switching via env var
- Auth is production-ready: bcrypt/12, JWT/7d, rate-limited, Apple JWKS verified, Google OAuth, email verify + password reset token flows
- Role-based access: `requireAdmin` middleware, role-gated rate limits, `isPremium` server-side
- Operational tooling: Slack alerts, structured per-request console logging, `/health`, process error handlers, Redis retry strategy, in-memory stats cache
- API versioning started: `/1-1-1/` prefix established with legacy deprecation comment

**Scale assessment:** Appropriate for current user base on Mac mini M4. Main bottleneck at scale is OG image canvas generation (CPU-bound, synchronous in request handler) and default Prisma connection pool. Codebase is ~2,000 lines of TypeScript across ~20 files — readable and maintainable.