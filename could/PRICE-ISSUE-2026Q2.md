ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:backend 2026-06-22 11:03 → No server-side purchase receipt validation; premium is admin-granted only; store metrics pipeline reads correctly but doesn't drive role changes
## ISSUE:backend 2026-06-23 14:32 -> Rate limits unchanged, no payment webhook wired to role promotion, insight analysis has no tier gating, DB lookup on every rate-limited request

**Rate limits unchanged from 2026-06-13 entry:**

| Role | Ollama/hr | Claude/hr |
|---|---|---|
| free | 3 | 2 |
| premium | 10 | 5 |
| admin | unlimited | unlimited |

**No payment path to `premium` role:**
`src/services/appstore.ts` (Apple receipt validation) and `src/services/playstore.ts` (Google Play verification) exist but neither calls `prisma.user.update({ data: { role: "premium" } })`. The only way to set `role = "premium"` is a direct DB update or an admin action. There is no webhook, no IAP callback, and no `/subscribe` endpoint.

**Insight analysis has no tier gating:**
`runInsightAnalysis()` in `src/services/ai/insights.ts` is called without checking `User.role`. Free users receive AI-personalised insights identical to premium users. If insights are intended as a premium differentiator, the gate is missing.

**DB lookup on every rate-limited generate request:**
`recipeGenerateRateLimit()` calls `prisma.user.findUnique()` to fetch `role` on every invocation. At current scale this is acceptable, but it adds a synchronous DB round-trip before the Redis check on every recipe generate call.
## ISSUE:backend 2026-06-23 11:23 → No server-level Claude spend cap; YouTube searched twice per recipe; no aggregate quota protection

1. Claude API (claude-haiku-4-5-20251001): called on every `provider=claude` request from premium users, up to 5 times per user per hour. No server-level daily or monthly spend cap exists in code — only per-user hourly Redis limits. Under a large number of concurrent premium users, Claude costs are unbounded.
2. YouTube Data API v3: `findRecipeVideo` is called once inside `POST /recipes/generate` and potentially a second time inside `POST /recipes` (save) if `clientVideoId` is not passed by the client — up to 2 quota units per recipe lifecycle. YouTube's default quota is 10,000 units/day; no server-level guard prevents exhaustion.
3. No token usage logging from Anthropic responses (the `usage` field in the API response is not captured) — actual spend per request is invisible in metrics.
4. On Claude API errors (e.g., rate limit or quota from Anthropic), the failed request still counts as consumed before the Ollama fallback is triggered — cost without benefit.

---
## ISSUE:backend 2026-06-22 20:06 -> No IAP receipt validation path exists; admin role implicitly grants premium; continent preferences silently absent for free users

**1. No in-app purchase validation endpoint**
`src/services/appstore.ts` uses the App Store Connect API only for analytics metrics — there is no endpoint that validates a StoreKit receipt or Server Notification and upgrades `User.role` to `premium`. The same is true for Play Store: `playstore.ts` only queries crash/ANR rates. Premium role assignment has no automated path and must be set directly in the database. A paying customer cannot self-serve a role upgrade.

**2. `admin` role implicitly grants all premium benefits**
`src/middleware/rateLimit.ts:2787`: `if (role === "admin") { next(); return; }` bypasses all rate limits. `src/routes/users.ts:1540`: `isPremium: user.role !== "free"` — admin users appear as premium to the client. If an admin account is compromised, the attacker receives unlimited generation and premium UX. Explicitly checking `role === "premium" || role === "admin"` only in the rate-limit bypass (not in `isPremium`) would allow separating the two concerns.

**3. Continent preferences are silently ignored for Ollama (free-tier default)**
`src/routes/recipes.ts:215`: `const continentPreferences = provider === "claude" ? (user?.continentPreferences ?? []) : []`. Free users generating with Ollama never have their cuisine preferences applied, even if they have set them. The response gives no indication that the preference was ignored — the `continent` field in the response reflects what Ollama randomly selected, not the user's preference.
## ISSUE:price 2026-06-22 11:51 → YouTube API quota risk: every generate + save fires a search unit; OG images bloat Postgres

**YouTube quota burn**: `findRecipeVideo` is called in `POST /recipes/generate` unconditionally (no key-absent guard beyond a warn + null return), and again in `POST /recipes` (save) unless `clientVideoId` is passed. YouTube Data API v3 search costs 100 quota units per call; the free tier is 10,000 units/day — 100 generate calls/day exhausts the quota. The generate and save responses already pass `videoId` to the client, so the save re-fetch is redundant if the client always echoes it back. A quota monitor or server-side cache (keyed on recipe title) would reduce burn.

**OG images in PostgreSQL**: Recipe OG images are stored as `Bytes` in the `Recipe.ogImage` column. A 1200×630 PNG is ~200–500 KB each. At 1,000 saved recipes that's 200–500 MB of binary data in Postgres, not covered by any CDN or eviction policy. Recipes list queries (`GET /recipes`) do a `select` that excludes `ogImage`, which is good, but the column size still affects DB backup/restore cost and WAL overhead.

**GitHub API on every auth event**: Each login/register fires a GET + PUT to GitHub from `pushRowToGitHub`. Under auth load (e.g., 100 logins/minute) this creates 200 GitHub API calls/minute, consuming significant rate limit headroom and adding ~200–500 ms of network round-trip to every auth background job.

**Claude per-request cost**: At current `claude-haiku-4-5-20251001` pricing (~$0.80/MTok input, ~$4/MTok output) and prompt size (~500–800 tokens in + ~300 tokens out), each Claude recipe generation costs ~$0.002. The premium limit of 5/hour per user is economically safe at current scale.

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
