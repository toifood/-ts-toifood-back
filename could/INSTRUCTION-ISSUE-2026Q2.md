ISSUE LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:instruction {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Undocumented APIs, missing env vars, unclear onboarding steps

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:instruction 2026-06-23 11:23 → No README; 13+ env vars missing from .env.example; deployment steps undocumented

`.env.example` is present but missing at least 13 env vars referenced in source:
- `REDIS_URL` (rateLimit.ts, insights.ts — defaults to localhost:6379)
- `YOUTUBE_API_KEY` (youtube.ts)
- `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` (slack-bot.ts)
- `SLACK_WEBHOOK_URL` (slack.ts)
- `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID` (appstore.ts)
- `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME` (playstore.ts)
- `APP_WEB_URL` (recipes.ts share URL construction)
- `MIN_APP_VERSION` (index.ts /app-config endpoint)
- `CORS_ORIGIN` (index.ts — defaults to hardcoded toifood.co.nz origins)

No README.md exists in the repository. No API reference or route map. The 1-1-1 versioning scheme and the plan for retiring legacy (1-1-0) routes are entirely undocumented. `scripts/macmini-setup.sh` exists but is not referenced from any doc. PM2 process management, Cloudflare Tunnel setup, and Redis installation are assumed but not described anywhere.

---
## ISSUE:backend 2026-06-22 20:06 -> Two instruction gaps — Ollama silently drops dietary filters with no client signal, Google OAuth strategy conditionally absent at runtime

**1. Ollama silently drops dietary filters — no signal to the client**
`src/services/ai/ollama.ts:3854`: `const dietaryLine = ""` — dietary filters from the generate request are discarded without warning. `src/routes/recipes.ts:326` then sets `dietaryTags: usedProvider === "claude" ? validFilters : []`. A free-tier user who selects "Vegan" and receives an Ollama recipe gets a recipe that may not be vegan, with an empty `dietaryTags` array. The response gives no indication that the filter was not applied. A `filtersApplied: boolean` field in the generate response, or a `filtersIgnored` warning, would make this explicit.

**2. Google OAuth Passport strategy is conditionally absent but the route is always registered**
`src/routes/auth.ts:1090-1126`: the Google strategy is only registered if `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are present in env. `GET /auth/google` and `GET /auth/google/callback` are always registered regardless. If the env vars are missing, a request to `/auth/google` crashes at runtime with a Passport strategy-not-found error rather than returning a clean 503. A route-level guard checking strategy availability before calling `passport.authenticate` would fail gracefully.
## ISSUE:instruction 2026-06-22 11:51 → README documents only legacy routes and omits 7 endpoint groups added since March

The README.md API reference documents only the original route set (`/auth`, `/recipes`, `/favourites`, `/users`) using the legacy bare-path prefix. It omits seven routes added since March 2026: `/pantry`, `/lists`, `/flows`, `/insights`, `/records`, `/chat`, `/store-metrics`. It also makes no mention of the `/1-1-1/` versioned prefix that all new clients should use. The `Favourites` section documents a `Favourite` model and three endpoints that no longer exist — the migration `20260414000000_remove_favourite_table` dropped the table. The shared directory (`shared/src/`) contains both `index.ts` and a compiled `index.js` — it is unclear whether the `.js` is generated or manually maintained, and the `shared/package.json` does not include a build script. The `.env.example` does not document several env vars used in code: `CORS_ORIGIN`, `MIN_APP_VERSION`, `GOOGLE_CHAT_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `TOIFOOD_CROSS_REPO_TOKEN`, `YOUTUBE_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `APP_WEB_URL`, `REDIS_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`.
## ISSUE:backend 2026-06-22 11:03 → storeReport.ts is broken, daily digest depends on pm2 + cross-account file, and auth metric GitHub push token is silently optional

**`storeReport.ts` is broken and should not be run** — References `-ARCHIVE/-WOULD/` paths that don't exist. If this script is registered in any pm2, cron, or CI job, it will fail on `fs.readFileSync`. The `could/USAGE-*` files are the current target for store KPI entries — `storeReport.ts` needs to be updated to write to `could/PRICE-ISSUE-2026Q2.md` and `could/PRICE-ASSET-2026Q2.md` (or `could/USAGE-*`) if it is to be revived.

**Daily digest requires `GOOGLE_CHAT_WEBHOOK_URL`** — `src/digest.ts` posts to Google Chat. If this env var is absent, it logs a warning and silently skips the post. The digest also reads `/Users/jayagent/.openclaw/logs/infra_health.log` across accounts. Both failures degrade gracefully but mean the digest may arrive empty without any alert.

**`TOIFOOD_CROSS_REPO_TOKEN` for auth metrics** — `routes/auth.ts` pushes each auth event row to `toifood-dev/ts-toifood-dev/would/AUTH-METRIC.csv` via GitHub API. If the token is absent or expired, the push is silently skipped (error caught, not re-thrown). The local `would/AUTH-METRIC.csv` is always written and is the authoritative copy.

**Deploy workflow** — Production on Mac mini:
1. `git pull` in the repo dir
2. `npm run build` → outputs to `dist/`
3. `pm2 restart toifood-back`

Prisma schema changes require additionally running: `npx prisma generate` (and the raw SQL migration on the live DB) before the build step.

**Redis cross-dependency** — Both `rateLimit.ts` and `insights.ts` connect to Redis. Rate limit failure is graceful (allows request). Insight failure is also graceful (fire-and-forget). No action needed on Redis restart — all state is short-lived TTL keys.
## ISSUE:instruction 2026-06-13 18:11 → README missing 16 env vars and omits all routes added since initial launch

The README `.env` table documents 10 variables but the codebase uses at least 26. Missing: `CORS_ORIGIN`, `APP_URL`, `MIN_APP_VERSION`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_WEBHOOK_URL`, `GOOGLE_CHAT_WEBHOOK_URL`, `REDIS_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`. The API section documents only Auth, Recipes, Favourites (removed), and Users — missing `/records`, `/insights`, `/lists`, `/flows`, `/store-metrics`, and `/admin` routes entirely. The versioned `/1-1-1/` prefix is undocumented. `src/digest.ts` and `src/storeReport.ts` have no run instructions. Apple Sign In audience `com.toifood.app` is hardcoded with no operator documentation.
## ISSUE:instruction 2026-06-13 17:04 → Linked docs missing from repo; 10+ env vars undocumented in README

**1. Missing docs referenced by README.** Two documents are linked from `README.md` but are absent from the git tree:
   - `docs/macmini-deployment.md` — "full Mac mini setup guide for the backend team"
   - `docs/openclaw-integration.md` — "how the local AI model connects to the backend"
   These are either untracked, in a different repo, or never created.

**2. Ten+ env vars used in code but absent from the README env table.** The README documents 10 vars; these are used in source but not listed:
`GOOGLE_CHAT_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `YOUTUBE_API_KEY`, `REDIS_URL`, `CORS_ORIGIN`, `MIN_APP_VERSION`, `APP_WEB_URL`, `APP_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`.

**3. `shared/` subpackage undocumented.** `shared/` has its own `package.json` and `tsconfig.json`. It exports `GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle`, and `SaveRecipeRequest` — types shared between backend and mobile client. There is no README or doc explaining how this package is published, symlinked, or consumed by the mobile repo.

**4. No test guide or CONTRIBUTING file.** Zero test files exist. New contributors have no guidance on test strategy, local DB setup, or how to run the dev server against a mocked AI provider.
## ISSUE:instruction 2026-06-09 18:16 â†’ src/routes/chat.ts is production-mounted with no documentation, no auth specification, and unknown AI cost profile; digest.ts and slack-bot.ts have no startup instructions or pm2 config entries in any doc

**chat route is a documentation black hole:**
- `src/routes/chat.ts` is mounted in `src/index.ts` and is serving in production, but:
  - README makes no mention of it
  - It is unknown whether it requires authentication or is open to unauthenticated callers
  - It is unknown whether it calls an AI provider (and therefore incurs cost per request)
  - It is unknown whether it is rate-limited
  - No endpoint spec exists for it in any doc file
- A new developer or security reviewer cannot assess the attack surface of this route without reading the source. An unauthenticated AI-calling chat endpoint would be a direct cost runaway vector.

**digest.ts and slack-bot.ts have no operational documentation:**
- Neither process is mentioned in `docs/macmini-deployment.md` or README. There are no instructions for:
  - How to start them (direct node? pm2? cron?)
  - Whether they should run on the Mac mini alongside the main API or separately
  - What environment variables they require
  - How to monitor if they are running
  - How to restart them after a Mac mini reboot
- An operator doing a fresh Mac mini setup from docs would not start these processes, silently losing digest summaries and Slack bot functionality.

## ISSUE:instruction 2026-06-09 18:03 â†’ No documented deprecation timeline for unversioned paths; UserRole promotion undocumented; no runbook for Redis or Ollama outage; insight category list not exposed

**No deprecation timeline for legacy routes:**
- Both `/api/recipes` (unversioned) and `/1-1-1/api/recipes` (versioned) are mounted and functional. The comment in `src/index.ts` says legacy paths will eventually be deprecated, but no date is set, no deprecation header is returned, and mobile clients have no way to discover they are using a legacy path. If the API is shared externally, removing unversioned routes will silently break consumers.

**UserRole promotion process undocumented:**
- `UserRole` (free/premium/admin) controls rate limits and feature access, but there is no endpoint to upgrade a user's role. Only direct DB edit (`UPDATE users SET role = 'premium' WHERE id = X`) or an undocumented admin API can promote users. No runbook, no README section, no internal doc describes this.

**No runbooks for critical dependencies:**
- Redis outage: rate limiting silently disabled â€” no documented response procedure for detecting this, no Slack alert fires. An operator discovering unexpectedly high AI costs has no documented checklist to correlate with a Redis outage.
- Ollama (`qwen2.5:7b`) outage: no documented fallback instruction. If the local model goes down on the Mac mini, all free-tier recipe generation silently fails with a 500. No runbook tells the operator to switch `AI_PROVIDER=openai` temporarily.

**Insight categories not enumerated in API:**
- `UserInsight.category` is a free-form string in the schema. There is no enum, no `GET /insights/categories` endpoint, and no documentation of which categories the AI generates. Mobile clients have no way to display category labels without hardcoding them, creating a coupling that breaks when new categories are added.
## ISSUE:instruction 2026-06-07 16:30 â†’ New 1-1-1 versioned route prefix undocumented; CookRecords, Insights, StoreMetrics, Chat endpoints absent from README; shared types not mentioned

**Versioned routing undocumented:**
- All routes are now served under `/1-1-1/` prefix (e.g. `/1-1-1/api/recipes`, `/1-1-1/auth`), with legacy unversioned paths kept alive. README still shows only unversioned paths. Any new developer integrating will use old paths, which will eventually be deprecated.

**New endpoints missing from README:**
- `POST /1-1-1/api/records/start` â€” start a cook session
- `PATCH /1-1-1/api/records/:id/complete` â€” complete a cook session
- `PATCH /1-1-1/api/records/:id/abandon` â€” abandon a cook session
- `GET /1-1-1/api/records` â€” list cook records
- `GET /1-1-1/api/insights` â€” get AI-generated user insights
- `PATCH /1-1-1/api/insights/:id` â€” accept or dismiss an insight
- `GET /1-1-1/api/store-metrics` â€” AppStore/PlayStore metrics (admin only)
- `GET /1-1-1/api/chat` / `POST /1-1-1/api/chat` â€” chat routes (not reviewed but present)

**Shared types not documented:**
- `shared/src/index` exports `GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle` â€” these are the canonical types for AI recipe generation but not mentioned anywhere in README.

**Environment variables not documented:**
- `REDIS_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `MIN_APP_VERSION`, `CORS_ORIGIN` all used in code but absent from README env var table.
## ISSUE:instruction 2026-06-07 10:00 â†’ README documents a stale API surface; Apple OAuth, Redis, SavedLists, Pantry, Flows, admin routes all missing

**Missing from README:**
- Apple Sign In (`POST /auth/apple`) â€” not documented
- Redis requirement â€” `ioredis` is a hard dependency for rate limiting; not mentioned in setup
- `SavedList`/`SavedListItem` routes (`/lists`) â€” README only documents Favourites, which no longer exists as a separate model
- Pantry routes (`/pantry`) â€” not documented
- Flows routes (`/flows`) â€” not documented
- Admin routes (`/admin`) â€” not documented
- Chat routes (`/chat`) â€” not documented
- `GET /stats`, `GET /app-config`, `GET /health` â€” only health is documented
- `ANTHROPIC_API_KEY` listed as optional but required when `AI_PROVIDER=claude`
- `UserRole` system (free/premium/admin) â€” not documented; no instructions on how to promote a user
- `REDIS_URL` env var â€” not in `.env` table

**Data model section in README is outdated:**
- Still shows `Favourite` model (removed/replaced by `SavedList`)
- Missing: RecipeReview, SavedList, PantryItem, Flow, UserFlowView, tokens

**Action needed:** Full README rewrite to match current routes, env vars, and data models. Document Redis setup. Document how to set user roles.
