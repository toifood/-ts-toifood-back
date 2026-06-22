ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Three active metric CSVs with clear schemas; daily digest posts to Google Chat with Ollama-summarised log analysis
## ASSET:backend 2026-06-22 20:06 -> Per-request CSV metrics with pantry match columns and auth event log give production observability without a telemetry service

**Pantry match analytics in every recipe metric row**
`RECIPE-METRIC.csv` records `pantryMatchCount`, `pantryPct`, `groceryMatchCount`, `groceryPct`, `continent`, and `promptVersion` on every generation. Average pantry utilisation by provider, style, or prompt version is queryable with a simple CSV grep — no aggregation pipeline or analytics service needed. The `promptVersion` column enables prompt A/B comparison directly from the file.

**Auth event log with method and IP fields, local-IP filtered**
`AUTH-METRIC.csv` records `event` (register/login), `method` (password/google/apple), `success`, `failReason`, and `ip` per event. The `LOCAL_IPS` guard in `appendAuthMetric` excludes loopback addresses, so the file contains only external production traffic. Repeated failed logins from an IP, Apple auth failure spikes, or registration anomalies are detectable from the CSV without a WAF or SIEM.

**`!metrics` chat command gives on-demand today-counts**
`src/routes/chat.ts:2633-2641`: `getMetricsSummary` reads today's lines from both metric CSVs and posts recipe and discover counts to Google Chat on `!metrics`. This provides a real-time production health check accessible to anyone in the ops chat without needing server access or a dashboard.
## ASSET:usage 2026-06-22 11:51 → Usage instrumentation snapshot June 2026

| Signal | Mechanism | Storage | Coverage |
|---|---|---|---|
| Recipe generation | RECIPE-METRIC.csv append | Local `would/` dir | Per-generation: provider, latency, style, pantry %, grocery %, filters, continent, title |
| Discover feed queries | DISCOVER-METRIC.csv append | Local `would/` dir | Per-query: pantry size, result count, avg match rates |
| Auth events | AUTH-METRIC.csv append + GitHub push | Local + `ts-toifood-dev` repo | Per-event: method (password/google/apple), success/fail, IP (non-local only) |
| Daily digest | DIGEST-METRIC.csv append | Local `would/` dir | Daily rollup: recipe count, discover count, provider split, avg latency, memory health |
| Cook records | PostgreSQL CookRecord table | DB | Per-cook: recipe, status (STARTED/COMPLETED/ABANDONED), pantry/grocery split, servings |
| AI insights | PostgreSQL UserInsight table | DB | Per-user weekly: 5 categories, suggestion text, status (pending/accepted/dismissed) |
| App store KPIs | AppStore Connect API + Play Developer Reporting | In-memory cache (1hr) | iOS: installs, sessions, active devices, crashes; Android: crash rate, ANR rate |
| Request logging | Console via `res.on('finish')` middleware | PM2 stdout | Every request: method, path, status, latency, userId |

**`RECIPE-METRIC.csv`** — Written on every successful recipe generation. Columns: timestamp, userId, requestedProvider, usedProvider, fallback, responseMs, style, filters, pantrySelectedCount, ingredientCount, steps, pantryMatchCount, pantryPct, groceryMatchCount (buggy — see USAGE-ISSUE), totalIngredients, groceryPct (buggy), promptVersion, continent, title. Covers provider split, fallback rate, response latency, pantry efficiency, and cuisine distribution.

**`AUTH-METRIC.csv`** — Written on every non-local auth event (register, login, Apple, Google). Columns: timestamp, event, method, userId, success, failReason, ip. Local IPs filtered out. Also pushed to `toifood-dev/ts-toifood-dev` for offsite retention.

**`DISCOVER-METRIC.csv`** — Written on every discover query that returns results. Columns: timestamp, userId, pantrySize, resultCount, avgPantryPct, avgGroceryPct. Useful for measuring pantry engagement with the community feed.

**`DIGEST-METRIC.csv`** — Written by `src/digest.ts`. Daily aggregate row: recipeCount, discoverCount, ollamaRecipes, claudeRecipes, avgResponseMs, wiredMb (from jayagent infra log), usableMb, ollamaStatus.

**Daily digest pipeline** (`src/digest.ts`):
1. Reads today's rows from RECIPE-METRIC.csv and DISCOVER-METRIC.csv
2. Reads pm2 error logs (last 40 lines, filters for error/warn)
3. Reads jayagent infra health log (`/Users/jayagent/.openclaw/logs/infra_health.log`)
4. Calls Ollama twice to summarise log errors and infra health
5. Posts two Google Chat messages (recipe stats + infra health)
6. Appends a row to DIGEST-METRIC.csv

All metric writes are wrapped in try/catch — failures never block request handling.
