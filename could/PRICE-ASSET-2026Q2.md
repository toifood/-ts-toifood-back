ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Rate limit structure, role hierarchy, and store metric fetchers are clean and stable

**LIMITS object** in `rateLimit.ts` is the single source of truth for per-role per-provider quotas. Adding a new tier (e.g., `enterprise`) requires only adding a key to `LIMITS` and a corresponding `UserRole` enum value.

**Store metric fetchers:**
- `getAppStoreMetrics()` — fetches installs, sessions, activeDevices, crashes from App Store Connect API v1 for last 30 days. Returns `null` if any of the 4 required env vars is absent. Errors per-metric are caught individually (returns `null` for that metric).
- `getPlayStoreMetrics()` — fetches crash rate and ANR rate from Play Developer Reporting API (7-day window) using service account JSON. `installs30d` and `activeDevices30d` are explicitly `null` (require BigQuery export not available via API alone). Returns `null` if `PLAY_SERVICE_ACCOUNT_JSON` or `PLAY_PACKAGE_NAME` absent.

**`storeReport.ts` structure** (once paths are fixed) correctly separates the ISSUE entry (observations, flags for crashes > 10 or ANR > 0.5%) from the ASSET entry (raw metric table). This is the right pattern for separating signal from snapshot.
