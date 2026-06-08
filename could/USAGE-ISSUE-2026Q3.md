ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:usage 2026-06-08 10:00 → CookRecord aggregation gap, insight trigger opacity, and store metrics admin-lock unchanged from Q2

No new analytics or usage-surfacing endpoints were added in the bug-fix round. All Q2 gaps carry into Q3:

- `CookRecord` stores pantry/grocery split, servings, ingredient lists per cook session, but no aggregation endpoint exists — questions like "% of ingredients typically in pantry" or "completion vs. abandonment rate" cannot be answered from the API
- `runInsightAnalysis()` trigger remains opaque — no scheduled job, no queue, no explicit trigger point visible at the route level; users with old recipe libraries may never receive AI insights
- `GET /store-metrics` is admin-only — no read-only analytics role, so product team members need admin credentials to view AppStore/PlayStore install counts
- `UserFlowView` collects onboarding flow completion and step drop-off data but no admin endpoint aggregates it
- `Recipe.provider` field exists to record which AI generated each recipe, but consistent write behaviour (whether it's always populated on save) is unverified from the route level
- Console request logging is the only structured telemetry — no sink for log history after rotation; no Datadog, Loki, or equivalent