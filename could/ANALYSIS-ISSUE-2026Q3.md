ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:analysis 2026-07-04 07:06 → Dead code, triplicated stemming logic, duplicated ops helpers, and dual route mounting add drift risk

**Dead AI-provider plumbing — `src/services/ai/index.ts`, `openai.ts`**
`getAIProvider()` is imported in `src/routes/recipes.ts` but never called — the generate route instantiates `ClaudeProvider`/`OllamaProvider` directly. `OpenAIProvider` (gpt-4o) is therefore unreachable in production; the `AI_PROVIDER` env var documented in the README does nothing.

**`pluralStem` exists in three divergent versions**
`src/routes/cookRecords.ts` has the robust version (irregular map, `-ee` guard, `ss` protection); `src/routes/recipes.ts` inlines a naive version (`.replace(/s$/,"")` — "glass"→"glas", "hummus"→"hummu"); `src/routes/recipes.ts` discover uses plain `LOWER()` equality in SQL. The same recipe can get different pantry-match numbers at generate time, cook-start time, and discover time.

**Duplicated PM2 helpers — `src/routes/chat.ts` vs `src/slack-bot.ts`**
`getPm2Status`, `getRecentLogs`, `getMetricsSummary` are copy-pasted between the Google Chat route and the Slack bot (the comment in chat.ts admits "mirrored from slack-bot.ts"). Fixes to one will silently miss the other.

**Dual route mounting — `src/index.ts`**
Every router is mounted twice (`/1-1-6/...` and legacy root paths). The legacy block has no sunset mechanism or metric to tell when old builds have phased out, so it will linger indefinitely and doubles the exposed attack surface of unauthenticated routes like `/chat`.

**`src/storeReport.ts` hardcoded output paths**
`prependEntry` does `fs.readFileSync` on `-ARCHIVE/-WOULD/usage-issue-v1.md` with no existence check — if the files/dirs are absent the weekly report crashes after fetching metrics, and nothing is written anywhere.
