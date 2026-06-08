ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:instruction 2026-06-08 10:00 → README still stale; error codes and versioned routes undocumented; env vars incomplete

All Q2 documentation gaps remain open. No README updates were made in the bug-fix round. Additionally, one new gap was added:

- Error codes (`code` field) are now returned on all error responses across 8 routes (30+ distinct values), but are documented only in `ASSET-V1.md` — not in the README or any API reference a developer would find
- Versioned route prefix `/1-1-1/` is still undocumented in README — new integrators will use legacy unversioned paths that are slated for deprecation
- New endpoints remain absent from README: `POST /records/start`, `PATCH /records/:id/complete`, `PATCH /records/:id/abandon`, `GET /records`, `GET /insights`, `PATCH /insights/:id`, `GET /store-metrics`, chat routes
- `REDIS_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `MIN_APP_VERSION`, `CORS_ORIGIN` all used in code but absent from README env var table
- `UserRole` promotion flow (how to upgrade a user to premium or admin) is undocumented
- `shared/src/index` exports canonical AI generation types but is not referenced in README