ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Error handling coverage, validation boundaries, logging on failure paths

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:bug 2026-06-08 10:00 â†’ 5 bugs fixed; atomic rate limit, JWKS cache, XSS escaping, and stemMatch now in place alongside strong validation

**Bug fixes applied (branch 1-1-1):**
| Fix | File | Detail |
|---|---|---|
| Apple JWKS cache | `src/routes/auth.ts` | `getCachedAppleKeys()` â€” 1hr in-memory TTL, prevents N concurrent external JWKS fetches |
| XSS in password reset | `src/routes/auth.ts` | `escHtml()` escapes `&`, `<`, `>`, `"` on `token` + `msg` before HTML interpolation |
| Atomic rate limit | `src/middleware/rateLimit.ts` | Lua script: INCR + EXPIRE in single round-trip â€” eliminates race where both requests see `count===1` |
| Unhandled promise | `src/routes/recipes.ts` | `void initPlaceholder()` â€” startup race on OG image placeholder removed |
| Plural stem matching | `src/routes/cookRecords.ts` | `pluralStem()` rewritten with irregular map + `-ee` invariant guard |

**Unchanged bug-prevention assets:**
- Input validation on all boundaries: email â‰¤100, name â‰¤50, password 8â€“128, dietary filters â‰¤3, lists â‰¤5, pantry â‰¤50 items
- Ownership guards on every mutable route â€” `{ id, userId: req.userId! }` fetch prevents IDOR
- DB-level unique constraints: PantryItem, RecipeReview, UserInsight â€” backed by P2002 catch in routes
- bcrypt cost factor 12, JWT 7-day expiry, `express-rate-limit` on all auth endpoints (10 req/15 min)
- Error code field on all error responses â€” distinguishes error types without parsing message strings
- Apple JWKS verified with RS256; Google identity verified server-side via Passport