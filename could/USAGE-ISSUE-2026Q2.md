ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:backend 2026-06-22 11:03 → groceryPct in RECIPE-METRIC.csv is incorrect, cook record usage not in any CSV, and DIGEST-METRIC.csv is undocumented
## ISSUE:usage 2026-06-22 11:51 → Metric CSVs are local-only with no replication; discover feed exposes full ingredient lists of other users' recipes

**Local-only metric storage**: `RECIPE-METRIC.csv`, `DISCOVER-METRIC.csv`, `AUTH-METRIC.csv`, and `DIGEST-METRIC.csv` are all written to the `would/` directory on the Mac mini. A hardware failure or OS reinstall loses all historical metrics. Only `AUTH-METRIC.csv` has a GitHub push mechanism (with reliability caveats noted in BUG). The recipe and discover metrics have no off-machine backup.

**Discover feed leaks full ingredient lists**: `GET /recipes/discover` returns the full `ingredients` and `steps` arrays for other users' shared recipes. The query already excludes recipes where `shareToken IS NULL`, but a user who shares a recipe has no way to share only a summary — full recipe detail is always exposed. This is a product design decision but worth noting as the discover feed grows.

**No server-side pagination on discover**: The discover query has `LIMIT 20` hard-coded with no offset/cursor support. As the shared recipe pool grows, users always see the same top-20 pantry-matched results with no way to browse further.

**Stats endpoint uses rounded counts**: `GET /stats` returns `recipesGenerated` and `cooksJoined` rounded to nearest 10. This is intentional for privacy but means the public stats page is not useful for monitoring exact growth.

**Insights system has no visibility**: The 5 AI-generated insight categories per user run silently. There is no admin endpoint to view insight generation status, error rates, or category distribution across the user base.

**`groceryPct` column in `RECIPE-METRIC.csv` is wrong** — As noted in BUG-ISSUE: `groceryMatchCount` is set to `pantryUsed.length` instead of `totalIngredients - pantryUsed.length`. This means the `groceryPct` column in every CSV row records pantry match percentage again rather than grocery (non-pantry) ingredient percentage. Any analysis of this column since the metric was introduced is measuring the wrong thing.

**Cook record data is DB-only** — `CookRecord` tracks STARTED/COMPLETED/ABANDONED statuses with full ingredient lists, pantry/grocery splits, and timing. This data is rich enough for conversion funnel analysis (what % of generated recipes get cooked?) but is not exported to any CSV. To query it, you need direct DB access.

**`DIGEST-METRIC.csv` is undocumented** — `src/digest.ts` writes to `would/DIGEST-METRIC.csv` with columns: timestamp, recipeCount, discoverCount, ollamaRecipes, claudeRecipes, avgResponseMs, wiredMb, usableMb, ollamaStatus. This file aggregates daily totals and infra snapshots but is not referenced in any USAGE doc.

**`storeReport.ts` is broken** — The script that was intended to write store KPI entries references `-ARCHIVE/-WOULD/` paths that don't exist. Store metrics are accessible via the `GET /store-metrics` admin endpoint but are not being logged to `could/PRICE-*` files automatically.

**Discover metric sparsity** — `DISCOVER-METRIC.csv` is only written when a discover query returns results (`scored.length > 0`). Zero-result discover queries (user with no pantry, or no shared recipes matching ≥20% grocery threshold) are not logged.
