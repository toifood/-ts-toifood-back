ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:backend 2026-06-22 11:03 → Three active metric CSVs with clear schemas; daily digest posts to Google Chat with Ollama-summarised log analysis

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
