ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Breaking schema changes, missing rollback, data loss risk

PATHS:
prisma/
####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:migrate 2026-06-08 10:00 â†’ Q2 migration risks remain open; no new schema changes in bug-fix round

No schema migrations were applied since the Q2 analysis. The 1-1-1 bug-fix round (JWKS cache, rate limit Lua, XSS fix, stemMatch rewrite, initPlaceholder void) touched only application code, not `prisma/schema.prisma`. The pantry cap change (30â†’50) was a code constant, not a migration.

**Open risks carried into Q3:**
- `ogImage Bytes` column on Recipe has no archival strategy â€” table bloat accumulates with every recipe generated; no size cap, no S3 offload
- `UserInsight.data`, `CookRecord.ingredients/pantryItems/groceryItems` are raw `Json` columns â€” any AI output format change or ingredient structure change silently passes validation
- `DietaryPreference`, `PasswordResetToken`, `EmailVerificationToken` have no cascade from User in schema â€” manual delete in route is the only guard; any new delete path that omits this will leak orphan rows
- Expired `PasswordResetToken` and `EmailVerificationToken` rows accumulate with no cleanup job â€” no TTL-based purge or periodic sweep exists