MUST ISSUE LOG
prompt: TODOs, stubs, incomplete flows, API surface implying features not yet implemented, breaking gaps
path: must/ROADMAP-ISSUE-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:ROADMAP 2026-06-29 06:25 ▸ Three implementation stubs: Play Store install metrics null, metrics CSV write path missing, YouTube service unrouted

Three gaps between API surface and implementation: (1) `src/services/playstore.ts` permanently stubs `installs30d` and `activeDevices30d` as `null` with comment "installs + active devices require BigQuery export from Play Console — not available via API alone" — metric dashboards will show null indefinitely without a BigQuery pipeline being built. (2) `src/routes/chat.ts` reads today's recipe and discover counts from `would/RECIPE-METRIC.csv` and `would/DISCOVER-METRIC.csv` (hardcoded `path.join(process.cwd(), 'would', '...')`), but no API endpoint or service writes to these CSV files — the `!metrics` command will always return 0 unless populated externally. (3) `src/services/youtube.ts` exists in the codebase but no route imports or calls it, while the `videoId` String field on the Recipe model implies intended YouTube video association — the retrieval and link mechanism is unimplemented.
