ISSUE LOG - USAGE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:usage {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
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
