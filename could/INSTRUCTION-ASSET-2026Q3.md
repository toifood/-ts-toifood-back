ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Existing docs, README completeness, inline documentation

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:instruction 2026-06-08 10:00 â†’ Error code reference table complete in ASSET-V1.md; versioned route structure and deployment docs in place

**New since Q2:**
- Complete error code reference (30+ codes across 8 routes) documented in `ASSET-V1.md` â€” frontend engineers can use this as an API contract without parsing error strings

**Unchanged instruction assets:**
- Route versioning pattern established: `/1-1-1/{auth|api|system}/` prefix; legacy unversioned paths maintained with explicit deprecation comment in `src/index.ts`
- `GET /1-1-1/system/health` â†’ `{ status: "ok", timestamp }` â€” uptime-monitorable
- `GET /app-config` â†’ `{ minVersion }` â€” mobile force-upgrade gate via `MIN_APP_VERSION` env var
- `GET /recipes/usage` â†’ per-user quota state â€” self-documenting quota to the client
- TypeScript interfaces in `shared/src/index` serve as implicit API contract for recipe generation request/response
- Deployment docs: `docs/macmini-deployment.md` (Mac mini M4 setup), `docs/openclaw-integration.md` (Ollama integration)
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` â€” plus optional AI provider, OAuth, AppStore/PlayStore keys