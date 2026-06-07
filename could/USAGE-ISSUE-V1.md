ISSUE LOG - USAGE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:usage {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:usage 2026-06-07 16:30 → CookRecord data collected but no aggregation endpoint; insight trigger unknown; storeMetrics data only via admin route

**CookRecord analytics gap:**
- `CookRecord` now stores pantry vs. grocery ingredient breakdowns per cook session, but there is no aggregation endpoint to answer questions like "what % of ingredients users typically have in pantry" or "how often do cooks abandon vs. complete". The data is collected but not surfaced.

**Insight trigger opacity:**
- `runInsightAnalysis()` exists in `src/services/ai/insights.ts` but it is unclear from the codebase when/where it is triggered. If it is triggered only on recipe save, users with old recipe libraries will never receive insights. No scheduled job or batch runner is visible.

**Store metrics:**
- `GET /store-metrics` is behind requireAdmin — only accessible to admins. If the product team wants to see AppStore/PlayStore install counts, they need admin credentials. No read-only analytics role exists.

**Flow view tracking:**
- `UserFlowView` tracks flow completion, skipped steps, and JSON responses — useful data — but no admin endpoint exists to query aggregate flow completion rates or step drop-off.

**Continent/dietary data collected but unused in reporting:**
- `continentPreferences`, `dietaryTags`, `mealType` are stored per-recipe but only surfaced in the public profile endpoint. No internal dashboard or aggregate query exists.
## ISSUE:usage 2026-06-07 10:00 → No analytics beyond console logs; recipe provider not tracked per-user in DB; UserFlowView written but never queried

**Analytics gap:**
- All request logging goes to console only: `[req] METHOD PATH STATUS DURATIONms userId=X`. No structured logging to a sink (e.g. Datadog, Loki, Seq). No way to query usage history after log rotation.
- `GET /stats` rounds all counts to nearest 10 for display — not useful for actual analytics. No admin dashboard endpoint that shows real counts.

**Recipe provider not persisted correctly:**
- `Recipe.provider` field exists in schema but it's unclear from routes whether the AI provider name (ollama/openai/claude) is consistently written on save. If missing, it's impossible to determine cost breakdown from DB alone.

**UserFlowView unused in queries:**
- `UserFlowView` table records onboarding flow completions, but no route returns aggregate completion rates. `GET /admin/flows` returns `_count: { views: true }` which gives total views but not completion vs. skip rates.

**Chat route undocumented:**
- `src/routes/chat.ts` exists but is not in README — unclear what it does or how it's used.

**YouTube integration:**
- `src/services/youtube.ts` is called per recipe generate — if it fails, it's unclear whether it's a blocking error or silent skip. No logging of how often video lookup succeeds.

**Action needed:** Add structured request logging. Consistently write `provider` on recipe save. Add analytics endpoints for admins. Document the chat route.
