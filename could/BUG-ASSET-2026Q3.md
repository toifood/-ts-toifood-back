ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:bug 2026-06-08 10:00 → 5 bugs fixed; atomic rate limit, JWKS cache, XSS escaping, and stemMatch now in place alongside strong validation

**Bug fixes applied (branch 1-1-1):**
| Fix | File | Detail |
|---|---|---|
| Apple JWKS cache | `src/routes/auth.ts` | `getCachedAppleKeys()` — 1hr in-memory TTL, prevents N concurrent external JWKS fetches |
| XSS in password reset | `src/routes/auth.ts` | `escHtml()` escapes `&`, `<`, `>`, `"` on `token` + `msg` before HTML interpolation |
| Atomic rate limit | `src/middleware/rateLimit.ts` | Lua script: INCR + EXPIRE in single round-trip — eliminates race where both requests see `count===1` |
| Unhandled promise | `src/routes/recipes.ts` | `void initPlaceholder()` — startup race on OG image placeholder removed |
| Plural stem matching | `src/routes/cookRecords.ts` | `pluralStem()` rewritten with irregular map + `-ee` invariant guard |

**Unchanged bug-prevention assets:**
- Input validation on all boundaries: email ≤100, name ≤50, password 8–128, dietary filters ≤3, lists ≤5, pantry ≤50 items
- Ownership guards on every mutable route — `{ id, userId: req.userId! }` fetch prevents IDOR
- DB-level unique constraints: PantryItem, RecipeReview, UserInsight — backed by P2002 catch in routes
- bcrypt cost factor 12, JWT 7-day expiry, `express-rate-limit` on all auth endpoints (10 req/15 min)
- Error code field on all error responses — distinguishes error types without parsing message strings
- Apple JWKS verified with RS256; Google identity verified server-side via Passport