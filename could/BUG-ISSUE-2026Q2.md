ISSUE LOG - BUG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:bug {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:bug 2026-06-07 16:30 → 6 production bug risks: unawaited placeholder init, Apple JWKS no cache, rate-limit race, HTML injection, missing email cascade, stemMatch false positives

**1. Unawaited `initPlaceholder()` (recipes route startup):**
- `initPlaceholder()` is called but not awaited at module load time. If canvas initialization takes time, the first recipe OG image request before the placeholder is ready returns null. Race condition at startup.

**2. Apple JWKS fetch on every auth call:**
- `POST /auth/apple` fetches `https://appleid.apple.com/auth/keys` on every request with no caching. Under concurrent Apple sign-ins, this fires N simultaneous external HTTP requests. If Apple throttles or returns 429, all concurrent sign-ins fail simultaneously.

**3. Rate limit INCR/EXPIRE race condition (`rateLimit.ts` lines ~70–72):**
- `redis.incr(key)` followed by a conditional `redis.expire(key, 3600)` only if `count === 1`. Under concurrent requests, two requests can both see `count === 1` before either sets the expiry — the key then never expires and permanently blocks the user. Should use a Lua script or `SET NX EX` atomic operation.

**4. HTML injection in password reset form (`auth.ts`):**
- `reset-password-form` POST handler injects `${token ?? ""}` directly into HTML response without escaping. A malformed token containing `<script>` would execute in the browser. The token is from the request body (not DB-validated at that point), so this is an XSS vector.

**5. EmailVerification token not cleaned up on user delete:**
- `DELETE /users/me` manually deletes `emailVerificationToken` but does NOT check if there are `DietaryPreference` records with a cascade issue — actually it does delete them. However, if a user has an active `EmailVerificationToken` that was already consumed but the row wasn't deleted (edge case), the delete will fail with a FK constraint.

**6. `stemMatch` false positives in pantry matching:**
- `pluralStem()` in `cookRecords.ts` is a naive plural stripper. "tomatoes" → "tomato" works, but "eggs" → "eg", "peas" → "pea", "cheese" → "chees". These stems can cross-match unrelated ingredients (e.g., "chees" matches "cheesecake"), causing incorrect pantry/grocery categorization in cook records.
