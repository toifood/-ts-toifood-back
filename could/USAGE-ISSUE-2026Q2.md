ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:backend 2026-06-22 11:03 → groceryPct in RECIPE-METRIC.csv is incorrect, cook record usage not in any CSV, and DIGEST-METRIC.csv is undocumented
## ISSUE:back 2026-06-23 15:14 → Feature usage patterns and API surface overview for ts-toifood-back

**Core recipe flow**
1. `POST /1-1-1/api/recipes/generate` — rate-limited by provider and role. Returns recipe JSON + OG image base64 + YouTube videoId. Metrics appended to `would/RECIPE-METRIC.csv`.
2. `POST /1-1-1/api/recipes` — saves the generated recipe to DB. Accepts `ogImageBase64` and `videoId` from the generate response to avoid re-fetching. Triggers insight analysis fire-and-forget.
3. `GET /1-1-1/api/recipes` — returns up to 500 recipes for the authenticated user, newest first, with `listIds` embedded per recipe.

**Discover feed**
- `GET /1-1-1/api/recipes/discover` — returns top 20 shared recipes ranked by pantry ingredient overlap (`matchCount DESC`). Filtered to `groceryPct >= 20%`. Metrics appended to `would/DISCOVER-METRIC.csv`.

**Cook records**
- `POST /1-1-1/api/records/start` — creates a CookRecord with pantry vs. grocery split computed at start time using the robust `pluralStem` matcher.
- `PATCH /1-1-1/api/records/:id/complete` or `/abandon` — updates status.

**Insights**
- `GET /1-1-1/api/insights` — returns latest pending insight per category (dietary, cuisine, style, pantry, mealType).
- `PATCH /1-1-1/api/insights/:id` — accepts/dismisses. Accepted dietary insights are auto-applied to preferences if under the 3-filter cap.
- Analysis is triggered after every recipe save with a 7-day Redis cooldown per user; minimum 5 saved recipes required.

**Saved lists**
- `GET/POST/PATCH/DELETE /1-1-1/api/lists` — max 5 lists per user (app-enforced).
- `POST/DELETE /1-1-1/api/lists/:id/recipes/:recipeId` — add/remove recipe from list.

**Admin / system**
- `GET/POST/PATCH /1-1-1/system/admin/flows` — flow management (admin-only).
- `GET /1-1-1/system/store-metrics` — iOS + Android KPIs, 1hr in-memory cache, admin-only.
- `GET /1-1-1/system/health` — health check, unauthenticated.
- `GET /1-1-1/system/stats` — public recipe + user count, 60s in-memory cache, rounded to nearest 10.
- `GET /1-1-1/system/app-config` — returns `minVersion` from env.

**Sharing**
- `POST /recipes/:id/share` — generates a 10-char nanoid token. Idempotent.
- `GET /recipes/public/:token` — unauthenticated public recipe view.
- `GET /recipes/public/:token/og-image` — serves pre-generated PNG with 24hr Cache-Control.

---
## ISSUE:backend 2026-06-23 14:32 -> Cook session completion rate untracked in digest, digest.ts mkdir gap, infra health path hardcoded, rate-limit hits still generate no structured metric

**1. Cook session completion rate absent from digest**
`CookRecord` rows carry `status` (STARTED/COMPLETED/ABANDONED), `pantryCount`, `groceryCount`, and `completedAt`. `src/digest.ts` does not query `CookRecord` at all. The daily Google Chat digest reports recipe generation and discover counts but has zero visibility into how often users actually cook a generated recipe — a key product retention metric.

**2. `digest.ts` writes `would/DIGEST-METRIC.csv` without mkdir guard**
`src/routes/recipes.ts` uses `fs.mkdirSync(dir, { recursive: true })` before writing to `would/`. `src/digest.ts` calls `fs.appendFileSync` directly with no directory check. On a fresh deploy without pre-creating `would/`, the daily digest silently throws and the Google Chat message is never posted.

**3. Infra health log path hardcoded to `/Users/jayagent/`**
```ts
const filePath = "/Users/jayagent/.openclaw/logs/infra_health.log";
```
Not configurable via env var. Rebuild or username change silently degrades digest to `"infra_health.log unreadable"` with no alert.

**4. Rate-limit hit events (429) still generate no structured metric**
Server request logger records `POST /1-1-1/api/recipes/generate 429` but no CSV row is appended. Hit rate by userId, role, and provider is unknown and cannot be queried or trended.
## ISSUE:backend 2026-06-23 11:23 → Local CSV metrics unqueryable remotely; no funnel event for generate-without-save; CookRecord data uncollected

1. RECIPE-METRIC.csv and DISCOVER-METRIC.csv are written to the local Mac Mini filesystem — not accessible from anywhere except SSH. Only AUTH-METRIC.csv is cross-repo pushed to GitHub. No aggregation layer, no dashboard, no historical trend visible without direct filesystem access.
2. No event is logged when a user calls `POST /recipes/generate` but never calls `POST /recipes` (save). The generate-to-save conversion rate — a key product health signal — is unobservable from current metrics.
3. CookRecord tracks starts, completions, and abandons with full ingredient/pantry/grocery breakdown, but there is no admin endpoint or analytics query exposing this data. It is collected in the DB but entirely inaccessible from the API.
4. The Slack `!metrics` and Google Chat `!metrics` commands show only today's counts — no weekly or monthly trends, no per-provider breakdown in the ops interface.
5. `UserInsight` accepted vs dismissed rates are stored in the DB but never surfaced — insight effectiveness is unmeasured.

---
## ISSUE:backend 2026-06-22 20:06 -> Three usage tracking gaps — DIGEST-METRIC never surfaced, discover count missing from digest post, no retention policy on any CSV

**1. `DIGEST-METRIC.csv` structured rows are written but never read or reported**
`src/digest.ts:4236-4263` appends per-day rows (recipe counts, avg response ms, Ollama status, memory wired/usable) to `would/DIGEST-METRIC.csv`. This file is never read by any route, chat command, or the digest itself. The `!metrics` chat command reads `RECIPE-METRIC.csv` and `DISCOVER-METRIC.csv` directly. The DIGEST-METRIC structured data is inaccessible without SSHing to the Mac Mini.

**2. Discover feed count computed but not posted in the daily digest**
`src/digest.ts:4340`: `const discovers = readTodayDiscover()` is computed and passed to `appendDigestLog`, but the `digest` string built at line 4355 never references `discovers`. Operators viewing the Google Chat digest cannot see how many discover queries ran that day without directly reading the CSV.

**3. No retention policy or rotation on any metric CSV file**
`RECIPE-METRIC.csv`, `DISCOVER-METRIC.csv`, `AUTH-METRIC.csv`, and `DIGEST-METRIC.csv` are append-only with no size limit, rotation, or archiving. At sustained usage, these files grow indefinitely. There is no pre-append size check, no scheduled `logrotate` equivalent, and no alert if the `would/` directory approaches disk capacity.
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
