ASSET LOG - BUG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:bug {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:bug 2026-06-09 18:03 → Prisma P2002 catch pattern established for pantry dedup; enum validation at boundaries prevents garbage data; bcrypt/12 + JWT ensure auth bug surface is small

**P2002 catch pattern for idempotent inserts:**
- `POST /pantry` catches Prisma `P2002` (unique constraint violation) and returns 200 instead of 500 — the same pattern should be applied to `RecipeReview` and `UserInsight` upserts to prevent duplicate-key crashes from propagating as 500 errors.

**Enum validation prevents downstream bugs:**
- All DietaryFilter, continent, gender, ageRange, and UserRole values are validated against explicit enum sets before reaching DB. An invalid enum value never reaches Prisma — error is returned at the route layer with a clear 400 message, not a cryptic DB error.

**Auth bug surface is minimal:**
- bcrypt cost factor 12 makes brute-force impractical even if the hash table is exposed
- JWT 7-day expiry with secret validated at startup — expired tokens return 401 before any DB query runs
- `express-rate-limit` on auth routes (10 req/15 min/IP) prevents password spraying
- Apple and Google identity verified server-side — no client-supplied claims are trusted

**Ownership model eliminates IDOR class:**
- Every fetch/mutate on user-owned resources (recipes, lists, pantry, records, insights) requires `{ id, userId: req.userId }` match — a correct userId in the JWT and correct resource id are both required. This pattern is consistent across all mutable routes, meaning IDOR bugs require both a valid user account AND guessing another user's resource IDs (UUIDs).

**Request parsing safety:**
- `express.json()` body parser in use — malformed JSON returns 400 before any route handler runs
- All text fields that could be user-supplied (name, email, ingredient) are length-capped and trimmed before DB write
## ASSET:bug 2026-06-07 16:30 → Strong validation on all input boundaries; ownership checks on all mutable routes; Prisma unique constraints prevent duplicates; auth rate limiting

**Input validation coverage:**
- `POST /auth/register`: email ≤100 chars, name ≤50 chars, password 8–128 chars — all validated before DB write
- `PATCH /users/me/preferences`: DietaryFilter enum validation, max 3 filters enforced, valid continent list enforced
- `PATCH /users/me`: ageRange and gender validated against explicit enum lists before DB update
- `POST /pantry`: ingredient trimmed, 30-item cap enforced, duplicate checked atomically (unique constraint + P2002 catch)
- `POST /lists`: max 5 lists per user enforced before creation

**Ownership guards on all mutations:**
- Every mutable route (records, pantry, lists, recipes) fetches the resource with `{ id, userId: req.userId! }` — prevents IDOR attacks. No route updates by id alone.

**Duplicate prevention:**
- `PantryItem @@unique([userId, ingredient])` — DB-level duplicate guard with P2002 catch in route
- `RecipeReview @@unique([userId, recipeId])` — one review per recipe per user enforced at DB level
- `UserInsight @@unique([userId, category])` — single active insight per category per user

**Auth security:**
- bcrypt with cost factor 12 for password hashing
- JWT with 7-day expiry, secret checked at startup
- `express-rate-limit` on all auth endpoints: 10 requests / 15 minutes
- Apple Sign-In verified with RS256 against Apple's JWKS — no client-supplied identity accepted
- Google OAuth identity token verified server-side via Passport strategy
