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
