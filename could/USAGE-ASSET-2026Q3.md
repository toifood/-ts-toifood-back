ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Monitoring hooks, structured logging, observability coverage

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:usage 2026-06-08 10:00 â†’ Error codes on all routes improve client diagnostics; CookRecord full session data collecting; AppStore + PlayStore metrics in place

**New since Q2:**
- All routes now return a `code` field on error responses â€” frontend can switch on `code` without parsing error strings; 30+ distinct codes across 8 routes (see ASSET-V1.md error code reference table)

**Unchanged usage assets:**
- `CookRecord` persists full cook session: `ingredientCount`, `pantryCount`, `groceryCount`, ingredient JSON arrays, servings override, `CookStatus` lifecycle
- AppStore (30-day installs, sessions, active devices, crashes) and PlayStore (7-day crash/ANR rates) metrics polled via service accounts and returned via `GET /store-metrics` (admin-only)
- `GET /recipes/usage` exposes per-user Redis quota state (used/max/ttl) for Ollama and Claude
- Every HTTP request logged: method, path, status, latency, userId â€” base telemetry for log-grep analysis
- `GET /stats` â†’ rounded recipe count + cooks joined (public); `GET /app-config` â†’ `minVersion` for mobile force-upgrade gate
- `UserFlowView` records onboarding completion, skipped steps, and response JSON per user per flow