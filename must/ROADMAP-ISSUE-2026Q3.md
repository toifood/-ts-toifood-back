MUST ISSUE LOG
prompt: review and update ROADMAP ISSUE compliance and business requirements for 2026Q3
path: must/ROADMAP-ISSUE-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ISSUE:ROADMAP 2026-07-06 07:13 ▸ Premium tier has no upgrade path; Play Store install metrics still stubbed; insight accept/apply flow removed leaving generate-only insights

Three gaps between API surface and implementation as of 2026Q3 start: (1) The `premium` role is fully modelled — `UserRole` enum in `prisma/schema.prisma`, elevated daily limits in `src/middleware/rateLimit.ts` (premium: ollama 10 / claude 5 vs free 3 / 2), and `authorIsPremium` surfaced in the discover feed (`src/routes/recipes.ts`) — but no code path can grant it: there is no billing/subscription/IAP/receipt route anywhere in the codebase, and `src/routes/admin.ts` exposes no role-change endpoint, so premium can only be set by direct DB edit. Monetization is implied by the schema but unshipped. (2) Carried from 2026Q2, still open: `src/services/playstore.ts` permanently returns `installs30d` and `activeDevices30d` as `null` (lines 59–61, "require BigQuery export from Play Console — not available via API alone") — store dashboards remain incomplete until a BigQuery pipeline exists. (3) The insight response flow was removed: migration `20260702000000_remove_insight_status` dropped the status column and `src/routes/insights.ts` now exposes only `GET /insights` — the 2026Q2 accept/auto-apply mechanism for dietary insights no longer exists, so weekly-generated `UserInsight` rows (`src/services/ai/insights.ts`) are display-only with no user action endpoint. Resolved since the 2026Q2 log: metrics CSV write path (now written by `appendMetric`/`appendDiscoverMetric` in `src/routes/recipes.ts`) and YouTube association (`findRecipeVideo` wired into recipe save and `GET /recipes/youtube`).
