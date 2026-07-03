ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:analysis 2026-07-04 07:06 → Architecture snapshot: Express+Prisma on Mac mini, local-first AI, versioned routes, ops tooling, new test suite

**Stack & topology** — Node/TypeScript + Express 4, Prisma 5 + PostgreSQL, Redis (ioredis) for rate limiting and insight cooldowns. Runs on a Mac mini M4 behind a Cloudflare Tunnel (`trust proxy` set); Ollama (`qwen2.5:7b`) on a second macOS account at `127.0.0.1:11434`.

**Module layout** — `src/routes/` (auth, recipes, users, pantry, lists, insights, chat, storeMetrics, cookRecords, admin guard), `src/services/ai/` (provider abstraction + Claude/Ollama/OpenAI implementations, insight analyzers), `src/services/` (email, youtube, appstore, playstore), standalone workers `digest.ts`, `slack-bot.ts`, `storeReport.ts`. Shared enums/types live in `shared/src/index.ts`, consumed by both repos.

**Key mechanisms**
- Versioned API prefix `/1-1-6/` with legacy root mounts kept alive for old app builds; `/app-config` serves `minVersion` for forced upgrade.
- Recipe generation: role-based Redis rate limit (Lua atomic INCR+EXPIRE), Claude→Ollama fallback, region/continent prompt rotation (`COUNTRY_REGIONS`), emoji gate (`FOOD_DRINK_SET` + title keyword inference), OG image rendered via `@napi-rs/canvas` and stored as `Bytes` on Recipe, YouTube video enrichment with 5s abort.
- Insights engine: 5 analyzers (dietary/cuisine/style/pantry/mealType) over last 50 recipes, weekly Redis cooldown, Ollama-phrased suggestions with deterministic fallbacks.
- Metrics: CSV append pipeline in `would/` (RECIPE, DISCOVER, AUTH, DIGEST) with AUTH rows also pushed to a GitHub repo; daily Google Chat digest with Ollama log summaries.
- Test suite (new since Q2): vitest 4 + supertest, 7 suites, DB truncation per test.
