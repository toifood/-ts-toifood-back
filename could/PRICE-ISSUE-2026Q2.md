ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:backend 2026-06-22 11:03 → No server-side purchase receipt validation; premium is admin-granted only; store metrics pipeline reads correctly but doesn't drive role changes

**No in-app purchase validation** — `src/services/appstore.ts` and `src/services/playstore.ts` fetch store metrics (installs, sessions, crashes) but do not validate purchase receipts. There is no App Store Server Notifications webhook endpoint and no Google Play Real-time Developer Notifications handler. Premium role must be granted by an admin via direct DB update or admin API — there is no automated upgrade path from a purchase event.

**Premium enforced only via rate limits** — In `src/routes/recipes.ts`, `isPremium` is computed as `user.role !== "free"` but is currently only used to pass `continentPreferences` to the Claude provider (line ~215). The actual premium gate is the rate limit difference: free gets 3 Ollama / 2 Claude per hour; premium gets 10 / 5. No other feature is currently gated on premium.

**`storeMetrics` endpoint is read-only and admin-gated** — `GET /store-metrics` (or `/1-1-1/api/store-metrics`) requires `requireAdmin`. It returns iOS and Android metrics with a 1-hour in-memory cache. This is useful for manual monitoring but does not feed back into role assignment.

**Rate limit values** (`src/middleware/rateLimit.ts`):
```
free:    { ollama: 3,   claude: 2  }
premium: { ollama: 10,  claude: 5  }
admin:   { ollama: 999, claude: 999 }
```
These are hardcoded — any change requires a redeploy. No configuration via env vars.
