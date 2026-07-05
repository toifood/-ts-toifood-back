MUST ASSET LOG
prompt: review and update ROADMAP ASSET compliance and business requirements for 2026Q3
path: must/ROADMAP-ASSET-2026Q3.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ASSET:ROADMAP 2026-07-06 07:13 ▸ Metrics pipeline and YouTube association shipped closing two Q2 gaps; versioned /1-1-6 API live; flow system and insight-status deliberately retired

Delivered entering 2026Q3: (1) End-to-end metrics pipeline — `src/routes/recipes.ts` writes `would/RECIPE-METRIC.csv` (19-column row incl. provider, fallback, responseMs, pantry/grocery match pcts, promptVersion) and `would/DISCOVER-METRIC.csv`; `src/digest.ts` reads both and posts a daily Google Chat digest with per-model stats and an Ollama-generated summary; `!metrics` in `src/routes/chat.ts` now returns real counts — closing a 2026Q2 ISSUE. (2) YouTube video association shipped: `src/services/youtube.ts` is routed via `findRecipeVideo` on recipe save (persisting `Recipe.videoId`) plus standalone `GET /recipes/youtube` — closing the second Q2 gap. (3) Versioned API surface live: all routes mounted under `/1-1-6/*` with legacy unversioned mounts kept until old builds phase out, plus `/app-config` `minVersion` (env `MIN_APP_VERSION`, default 1.1.6) enabling forced-upgrade control. (4) Deliberate scope retirements this quarter: flow system removed (migration `20260703000000_remove_flows_model`; `src/routes/flows.ts` deleted) and insight status dropped (`20260702000000_remove_insight_status`), simplifying insights to latest-per-category across dietary/cuisine/style/pantry/mealType. (5) Store observability suite in place: `src/services/appstore.ts` + `src/services/playstore.ts` (crash/ANR rates) behind `src/routes/storeMetrics.ts` and scheduled `src/storeReport.ts`. Open roadmap items: premium upgrade/billing path, Play Store BigQuery pipeline, insight action endpoints.
