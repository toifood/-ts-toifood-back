ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:usage 2026-07-04 07:06 → Instrumentation inventory: four CSV pipelines, cook funnel, store KPIs, daily digest, request logs

**CSV pipelines (`would/`)**
- `RECIPE-METRIC.csv` — 19 columns per generation: requested vs used provider, fallback flag, latency, style, filters, pantry/grocery match counts and percentages, prompt version, continent, title (CSV-escaped). Rich enough for provider A/B and prompt-version regression analysis.
- `DISCOVER-METRIC.csv` — per discover query: pantry size, result count, average pantry/grocery match.
- `AUTH-METRIC.csv` — register/login events with method (password/apple/google), success, fail reason, client IP; local-IP filtered; each row also pushed to GitHub (`pushRowToGitHub`) as an offsite copy.
- `DIGEST-METRIC.csv` — daily rollup: counts per provider, avg latency, Ollama memory/health snapshot — a longitudinal health time series.

**Behavioral funnels in the DB** — `CookRecord` captures start/complete/abandon with ingredient/pantry/grocery splits and servings (cooking engagement, not just saving); `RecipeReview` stars and `shareToken` usage measure social engagement; `UserInsight` history records what the system inferred about each user over time.

**Reporting layer** — daily digest to Google Chat (per-model recipe stats, discover count, Ollama-summarized error logs, infra health); weekly `storeReport.ts` pulls App Store Connect (P30D installs/sessions/active devices/crashes) and Play Console (7d crash/ANR rates) with threshold flags; `!metrics` in Slack/Chat gives today's counts on demand; request-log middleware stamps every request with userId and latency; public `/stats` exposes rounded growth counters for the marketing site.
