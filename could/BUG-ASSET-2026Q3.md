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
## ASSET:bug 2026-07-06 07:08 → Telemetry and alerting are fully isolated from request paths; external calls are consistently timeout-bounded with a flagged fallback chain

**Fire-and-forget side channels can never take down a request.** All three metric writers (`appendMetric` / `appendDiscoverMetric` in `src/routes/recipes.ts`, `appendAuthMetric` in `src/routes/auth.ts`) wrap file I/O in try/catch and degrade to a `console.warn`. Both alert helpers (`src/lib/chat.ts` `chatAlert`, `src/lib/slack.ts` `slackAlert`) no-op when the webhook env var is missing and swallow fetch failures with `.catch(() => {})`. Insight analysis after recipe save is explicitly fire-and-forget with its own `.catch` (`src/routes/recipes.ts`). A dead disk, missing webhook, or Redis outage degrades observability, not availability.

**Every external dependency is timeout-bounded.** Claude: `AbortSignal.timeout(30_000)` (`src/services/ai/claude.ts`); Ollama generation: 65s, deliberately just above the fallback threshold (`src/services/ai/ollama.ts`); YouTube search: 5s `AbortController` with `clearTimeout` in a `finally` (`src/services/youtube.ts`); digest summaries: 15s; insight suggestions: 8s with hardcoded fallback copy (`src/services/ai/insights.ts`). The generate route's Claude→Ollama fallback records `fallback=true` and `usedProvider` in RECIPE-METRIC.csv, so degradation is measurable, and total failure raises a `chatAlert(..., "error")` plus a friendly 500.

**Validation boundaries are explicit and coded.** Register enforces email ≤100, name ≤50, password 8–128 with per-field error codes; generate sanitizes ingredients (type-filter → trim → 50-char slice → drop empties → ≤50 items); notes ≤500 chars; review stars must be an integer 1–5; pantry is capped at 50 with a 409 duplicate response *and* a P2002 catch as a race backstop (`src/routes/pantry.ts`); lists capped at 5; preferences limited to 3 filters with whitelist validation of continents, ageRange, gender, and privacy keys (`src/routes/users.ts`). Rate limiting uses an atomic Lua INCR+EXPIRE and fails open with a warning when Redis is down (`src/middleware/rateLimit.ts`).

**Failure paths log with consistent, greppable tags.** Request-level logging middleware records method/path/status/duration/userId (`src/index.ts`), process-level `unhandledRejection`/`uncaughtException` hooks are installed, and error branches carry structured prefixes (`[recipe:generate]`, `[users:delete]`, `[og-image]`, `[rateLimit]`, `[auth-metrics]`). Enumeration-safe auth endpoints (`forgot-password`, `resend-verification`) always return 200 while logging internally.
## ASSET:bug 2026-07-05 07:03 → Fixes for the chat-webhook auth gap and email-casing bug

**1. Gate `/chat` behind a shared-secret check** (`src/routes/chat.ts`)
```ts
const CHAT_WEBHOOK_TOKEN = process.env.CHAT_WEBHOOK_TOKEN;

router.post("/", async (req: Request, res: Response) => {
  if (!CHAT_WEBHOOK_TOKEN || req.headers["x-webhook-token"] !== CHAT_WEBHOOK_TOKEN) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  // ...existing handler
});
```
Google Chat apps support a bearer token / bot token you configure once in the space integration and echo back on every request — swap `x-webhook-token` for whatever header/verification Google Chat actually sends (or verify the Google-signed JWT if using the newer Chat API) rather than a static token if stronger guarantees are needed.

**2. Normalize email casing everywhere it's read or written** (`src/routes/users.ts`)
```ts
// PATCH /me
const normalizedEmail = email ? email.toLowerCase() : undefined;
if (normalizedEmail && normalizedEmail !== user.email) {
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    res.status(409).json({ error: "That email is already linked to another account", code: "EMAIL_EXISTS" });
    return;
  }
}
// ...
data: {
  ...(normalizedEmail ? { email: normalizedEmail } : {}),
  ...
}
```
Consider a one-off backfill migration (`UPDATE "User" SET email = LOWER(email)`) plus a Prisma `@@unique` on a case-insensitive citext/lower expression if any existing rows already drifted into mixed case.

**3. Clean up the stale cascade comment** (`src/routes/users.ts:301`) — replace `UserFlowView` with the current cascade set (`CookRecord`, `UserInsight`, `RecipeReview`) so it matches `prisma/schema.prisma`.
## ASSET:bug 2026-07-04 07:06 → Error-handling inventory: layered timeouts, fallback chains, validation boundaries, coded error responses

**Process-level guards** — `index.ts` registers `unhandledRejection` and `uncaughtException` loggers so the pm2 process survives stray errors; request-logging middleware records method/path/status/latency/userId on every response.

**Timeout & fallback matrix**
- Claude API: 30s `AbortSignal.timeout`; on failure the generate route falls back to Ollama and records `fallback=true` in metrics.
- Ollama: 65s timeout (above fallback threshold by design); CJK bleed-through stripped post-parse.
- YouTube: 5s abort, returns `null`, never blocks a save; both callers also `.catch(() => null)`.
- Insights Ollama calls: 8s abort with deterministic fallback copy; analyzers run under `Promise.allSettled`.
- Redis down: rate limit middleware logs and skips (fail-open); `getRecipeUsage` returns zeroed defaults.
- `/stats`: 60s cache, serves stale cache on DB error.
- OG image: placeholder generated at startup, served for legacy recipes; logo/emoji draw failures degrade, never fail the request.
- Alerts (`chatAlert`/`slackAlert`): fire-and-forget with swallowed rejections — never block a request path.

**Validation boundaries** — password 8–128, email ≤100, name ≤50, ingredients ≤50 items × 50 chars each, pantry cap 50 + unique per user (P2002 handled as 409), lists max 5, notes ≤500 chars, stars integer 1–5, servings 1–4, enum-filtered dietary/continent/ageRange/gender values, boolean-checked privacy keys, listIds ownership-verified before assignment.

**Failure-path logging** — consistent tagged prefixes (`[rateLimit]`, `[youtube]`, `[og-image]`, `[insights]`, `[auth-metrics]`, `[recipe:*]`) and machine-readable `code` fields on every error response, giving the mobile client a stable contract.
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