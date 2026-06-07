ISSUE LOG - PRICE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:price {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:price 2026-06-07 10:00 → Claude/OpenAI API costs invisible; Redis outage silently disables rate limits; no billing integration for premium role

**Cost visibility gaps:**
- Claude provider (`src/services/ai/claude.ts`) has no usage logging — API call cost is invisible. No token counts, no per-user spend tracking in DB.
- OpenAI provider same issue — no usage logged, no cost alerting.
- Ollama is free (local), but Claude + OpenAI incur real API costs per recipe generation.

**Rate limit bypass risk:**
- When Redis is unavailable, `recipeGenerateRateLimit()` silently calls `next()` — rate limits are fully disabled. A Redis outage means unbounded Claude/OpenAI API calls, which could incur significant unexpected cost.
- No Slack alert is fired when Redis goes down and rate limiting is skipped.

**Premium tier without billing:**
- `UserRole` enum (free/premium/admin) exists and controls limits, but there is no payment processing, subscription management, or billing webhook in the codebase. The premium role can only be set by direct DB edit or admin tooling not visible in this repo.
- No endpoint to upgrade a user to premium — limits are enforced but there's no way for users to pay and self-upgrade.

**Action needed:** Add usage logging (tokens/cost) to Claude and OpenAI providers. Add Slack alert when Redis is unavailable and rate limiting falls back. Implement billing integration or document the manual upgrade process.
