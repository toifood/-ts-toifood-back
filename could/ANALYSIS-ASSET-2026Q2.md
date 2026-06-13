ASSET LOG - ANALYSIS
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:analysis {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Well-structured patterns, test coverage, production-ready components

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:analysis 2026-06-09 18:16 â†’ Express middleware stack is minimal and explicit; no framework magic; Prisma-generated types make DB schema the single source of truth; ownership-guard pattern is applied uniformly across all mutable routes

**Explicit, readable middleware stack:**
- The Express middleware chain in `src/index.ts` is short and explicit: CORS â†’ JSON body parser â†’ request logger â†’ routes. There is no hidden middleware injected by a framework, no auto-discovery, no decorator-based registration. Any developer reading `src/index.ts` top-to-bottom sees exactly what executes on every request, in order. This makes debugging request-level issues straightforward.

**Prisma schema as single source of truth:**
- `prisma/schema.prisma` is the authoritative definition of the data model. Prisma-generated TypeScript types flow into all route handlers via `@prisma/client` â€” there is no separate model layer, no manual type-to-table mapping, and no ORM configuration file. Adding a column to the schema automatically makes it available and typed throughout the application after `prisma generate`. The data model and the types are structurally in sync by construction.

**Uniform ownership-guard pattern:**
- Every route that mutates user-owned data (`recipes`, `lists`, `pantry`, `records`, `insights`) uses the same `{ id, userId: req.userId! }` where-clause pattern. The consistency of this pattern means ownership enforcement is auditable by grep: any route that queries by id alone is immediately identifiable as a potential IDOR risk. This regularity is a meaningful security asset â€” it is not accidental.

## ASSET:analysis 2026-06-09 18:03 â†’ Codebase is ~2000 LOC across ~20 files; TypeScript strict typing throughout; domain-aligned route structure; operational tooling (pm2, Slack, Redis, health) production-ready for current scale

**Codebase size and shape:**
- ~2,000 lines of TypeScript across ~20 source files â€” small enough for any developer to hold the full architecture in context, with no hidden complexity in deep dependency trees
- Routes are domain-aligned (one file per entity: recipes, users, auth, pantry, lists, records, insights, flows, admin, chat) â€” finding the handler for any endpoint is predictable
- No over-engineering: middleware is minimal (auth, rate-limit, admin check), no abstract base classes, no decorator magic. The complexity is proportional to the problem.

**TypeScript coverage:**
- Full TypeScript across all source files â€” no `any` escape hatches visible in public-facing route handlers
- Shared types in `shared/src/index` create a typed contract between backend and mobile client â€” breaking changes surface at compile time, not runtime
- Prisma-generated types make all DB queries type-safe â€” column name typos are compile errors

**Operational readiness at current scale:**
- pm2 process management with auto-restart â€” zero-downtime handling of uncaught exceptions
- Slack alerting for auth failures and recipe generation errors via `chatAlert()`
- Redis-backed rate limiting with exponential backoff â€” handles Redis instability gracefully
- `/health` endpoint suitable for load balancer or uptime monitoring
- In-memory stats cache with stale fallback â€” public-facing metrics survive DB hiccups

**AI architecture extensibility:**
- `AIProvider` interface + `getAIProvider()` factory â€” adding a fourth AI backend requires implementing one interface and registering the provider key. No other code changes needed.
- Runtime `AI_PROVIDER` env var switching â€” can hot-swap providers without redeployment (after pm2 restart with updated env)
## ASSET:analysis 2026-06-07 16:30 â†’ Production-grade auth stack, typed throughout, multi-provider AI, solid input validation; codebase healthy for current scale

**Tech stack:** Node.js 18+ / TypeScript / Express / Prisma ORM / PostgreSQL / Redis / Ollama (local AI) / JWT + bcrypt / Passport (Local + Google + Apple)

**Strengths:**
- **Full TypeScript** â€” all route handlers typed, shared types in `shared/src/index`, no implicit any visible
- **Multi-provider AI architecture** â€” `getAIProvider()` factory with Ollama/OpenAI/Claude backends, switchable at runtime via env var. Clean `AIProvider` interface in `provider.ts`.
- **Auth is production-ready** â€” bcrypt/12, JWT/7d, rate-limited, Apple JWKS verified, Google OAuth via Passport, email verification token flow, password reset token flow all implemented
- **Prisma ORM** â€” type-safe queries, migrations tracked, cascade deletes configured correctly for most models
- **Role-based access** â€” `requireAdmin` middleware, role-gated rate limits, `isPremium` computed server-side
- **Operational tooling** â€” Slack alerts via `chatAlert()`, structured console logs per request, `/health` endpoint, `process.on` error handlers, Redis retry strategy, in-memory `/stats` cache with TTL
- **API versioning started** â€” 1-1-1 prefix established with explicit comment about legacy deprecation plan

**Scale assessment:**
- Appropriate for current user base on a Mac mini M4. The main bottleneck at scale will be OG image canvas generation (CPU-bound, synchronous) and Prisma connection pool defaults.
- Codebase is ~2,000 lines of TypeScript across 20 files â€” manageable, readable, no premature abstraction.
