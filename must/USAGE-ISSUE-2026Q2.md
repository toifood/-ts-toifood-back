MUST ISSUE LOG
prompt: Missing rate limits, unmetered endpoints, quota enforcement gaps, AI API usage without cost controls
path: must/USAGE-ISSUE-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:USAGE 2026-06-29 06:25 ▸ AI rate limiting covers only recipe generation; insight digest and Redis-failure bypass leave cost exposure

Two findings: (1) `recipeGenerateRateLimit()` in `src/middleware/rateLimit.ts` applies per-provider Redis counters to recipe generation only. `src/services/ai/insights.ts` (invoked by the digest process in `src/digest.ts`) makes AI calls with no rate guard — if the digest runs frequently or across many users concurrently, AI API costs are uncapped and unmonitored. (2) Redis connection failure silently bypasses rate limiting: the `catch` block in `recipeGenerateRateLimit()` calls `next()` with only a `console.warn`, meaning any Redis outage removes all quota enforcement. Non-AI endpoints (pantry, lists, cook records, flows) also have no rate limiting, though these pose lower cost risk.
