ISSUE LOG - PRICE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:price {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Billing edge cases, subscription state mismatches, failed charge handling

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:price 2026-06-09 18:16 â†’ digest.ts and slack-bot.ts are unmetered auxiliary processes; heavy DB aggregation queries in digest compete with user traffic on single-node PostgreSQL; no read-replica strategy

**Auxiliary processes outside cost and query budgets:**
- `src/digest.ts` is a separate Node.js process that runs on a schedule (likely cron or setInterval). Its queries are not metered, rate-limited, or accounted for in any cost tracking. If it computes aggregate stats (`GROUP BY`, `COUNT(*)` on recipes, cook records, or users), it performs full table scans on the same single-node PostgreSQL instance serving user-facing API requests. No read-replica strategy exists.
- `src/slack-bot.ts` is another separate process that likely responds to Slack commands. If any Slack command triggers an AI provider call (e.g., "generate a test recipe"), that call is outside the rate-limit system entirely â€” no `ratelimit:{userId}:{provider}` key is checked.
- Neither process has documented query budgets, timeouts, or connection pool sizing. Three Node.js processes (main API + digest + slack-bot) share the same PostgreSQL instance with default Prisma connection pools â€” total connection count is `3 Ã— pool_size` with no configured limit.

**Token cost of digest AI calls:**
- If `digest.ts` generates a periodic Slack summary using an AI provider (e.g., summarising recipe trends), it uses Claude/OpenAI tokens with no `max_tokens` cap and no logging of token usage. These calls are invisible to the cost tracking system.

**Action needed:** Document the digest.ts query schedule and SQL profile. Set explicit Prisma `connection_limit` per process. If digest makes AI calls, add token usage logging. Gate slack-bot AI commands behind the same rate-limit middleware as the API.

## ISSUE:price 2026-06-09 18:03 â†’ Recipe save triggers up to NÃ—AI insight calls (one per category) outside rate limit scope; no per-call cost cap on OpenAI/Claude; store metrics polling unbounded

**Cost multiplication via insight pipeline:**
- Each recipe save can trigger `runInsightAnalysis()` which iterates over ALL insight categories for the user. If a user has 5 active categories, one recipe save = 5 AI provider calls. These calls are not counted against the per-user rate limit (which tracks `ratelimit:{userId}:{provider}` per recipe request, not per insight call). A user who generates 3 recipes/hr (at their free tier limit) could actually trigger 15+ AI calls per hour.

**No max_tokens cap on recipe generation prompts:**
- Neither the Claude provider (`src/services/ai/claude.ts`) nor the OpenAI provider include a `max_tokens` constraint in their API calls. A malformed or adversarial prompt could generate an unusually large completion, driving up token cost with no ceiling. Claude API allows up to 200K output tokens on some models.

**AppStore/PlayStore polling frequency uncontrolled:**
- `GET /store-metrics` is admin-only but calls live external APIs (App Store Connect, Google Play Developer Reporting) on each request. If an admin dashboard polls this endpoint frequently, it will exhaust Google's daily quota and trigger rate limits on Apple's API â€” neither of which alerts on failure.

**YouTube API quota invisible:**
- `findRecipeVideo()` runs on every recipe save. Google YouTube Data API v3 has a 10,000 unit daily quota. A day with 200+ recipe saves will exhaust the quota silently; subsequent recipes return no video with only a logged warning.

**Action needed:** Gate insight generation behind a job queue or debounce. Add `max_tokens` to all AI provider calls. Rate-limit the `/store-metrics` admin endpoint. Add YouTube quota exhaustion alerting.
## ISSUE:price 2026-06-07 16:30 â†’ Insight AI calls unbilled and unmetered; openai provider in recipe generation has no cost cap; Redis failure silently removes all rate limits

**Unmetered AI cost paths:**
- `runInsightAnalysis()` in `src/services/ai/insights.ts` calls the AI provider (Ollama/Claude/OpenAI) to generate insights for users. This runs server-side outside any rate limit middleware â€” no hourly cap, no per-user throttle. If the insights endpoint is triggered frequently, AI costs accumulate silently.
- The YouTube video search (`findRecipeVideo()`) runs on every recipe save â€” Google API quota is untracked.

**Rate limit bypass risk:**
- `rateLimit.ts` catches Redis errors and silently skips rate limiting (`console.warn` only). If Redis goes down, all users â€” including free tier â€” can generate unlimited recipes, directly driving OpenAI/Claude API costs.
- The `admin` role completely bypasses rate limits but there is no audit log of admin recipe generation volume.

**Pricing model gaps:**
- `premium` role is stored in DB but there is no subscription management, payment webhook, or Stripe integration. Role can only be set via direct DB update or admin API â€” no automated downgrade on payment failure.
- No metering of token usage per AI call â€” cost per recipe is unknown and untracked.
## ISSUE:price 2026-06-07 10:00 â†’ Claude/OpenAI API costs invisible; Redis outage silently disables rate limits; no billing integration for premium role

**Cost visibility gaps:**
- Claude provider (`src/services/ai/claude.ts`) has no usage logging â€” API call cost is invisible. No token counts, no per-user spend tracking in DB.
- OpenAI provider same issue â€” no usage logged, no cost alerting.
- Ollama is free (local), but Claude + OpenAI incur real API costs per recipe generation.

**Rate limit bypass risk:**
- When Redis is unavailable, `recipeGenerateRateLimit()` silently calls `next()` â€” rate limits are fully disabled. A Redis outage means unbounded Claude/OpenAI API calls, which could incur significant unexpected cost.
- No Slack alert is fired when Redis goes down and rate limiting is skipped.

**Premium tier without billing:**
- `UserRole` enum (free/premium/admin) exists and controls limits, but there is no payment processing, subscription management, or billing webhook in the codebase. The premium role can only be set by direct DB edit or admin tooling not visible in this repo.
- No endpoint to upgrade a user to premium â€” limits are enforced but there's no way for users to pay and self-upgrade.

**Action needed:** Add usage logging (tokens/cost) to Claude and OpenAI providers. Add Slack alert when Redis is unavailable and rate limiting falls back. Implement billing integration or document the manual upgrade process.
