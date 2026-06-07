ISSUE LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:instruction {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:instruction 2026-06-07 16:30 → New 1-1-1 versioned route prefix undocumented; CookRecords, Insights, StoreMetrics, Chat endpoints absent from README; shared types not mentioned

**Versioned routing undocumented:**
- All routes are now served under `/1-1-1/` prefix (e.g. `/1-1-1/api/recipes`, `/1-1-1/auth`), with legacy unversioned paths kept alive. README still shows only unversioned paths. Any new developer integrating will use old paths, which will eventually be deprecated.

**New endpoints missing from README:**
- `POST /1-1-1/api/records/start` — start a cook session
- `PATCH /1-1-1/api/records/:id/complete` — complete a cook session
- `PATCH /1-1-1/api/records/:id/abandon` — abandon a cook session
- `GET /1-1-1/api/records` — list cook records
- `GET /1-1-1/api/insights` — get AI-generated user insights
- `PATCH /1-1-1/api/insights/:id` — accept or dismiss an insight
- `GET /1-1-1/api/store-metrics` — AppStore/PlayStore metrics (admin only)
- `GET /1-1-1/api/chat` / `POST /1-1-1/api/chat` — chat routes (not reviewed but present)

**Shared types not documented:**
- `shared/src/index` exports `GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle` — these are the canonical types for AI recipe generation but not mentioned anywhere in README.

**Environment variables not documented:**
- `REDIS_URL`, `APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `MIN_APP_VERSION`, `CORS_ORIGIN` all used in code but absent from README env var table.
## ISSUE:instruction 2026-06-07 10:00 → README documents a stale API surface; Apple OAuth, Redis, SavedLists, Pantry, Flows, admin routes all missing

**Missing from README:**
- Apple Sign In (`POST /auth/apple`) — not documented
- Redis requirement — `ioredis` is a hard dependency for rate limiting; not mentioned in setup
- `SavedList`/`SavedListItem` routes (`/lists`) — README only documents Favourites, which no longer exists as a separate model
- Pantry routes (`/pantry`) — not documented
- Flows routes (`/flows`) — not documented
- Admin routes (`/admin`) — not documented
- Chat routes (`/chat`) — not documented
- `GET /stats`, `GET /app-config`, `GET /health` — only health is documented
- `ANTHROPIC_API_KEY` listed as optional but required when `AI_PROVIDER=claude`
- `UserRole` system (free/premium/admin) — not documented; no instructions on how to promote a user
- `REDIS_URL` env var — not in `.env` table

**Data model section in README is outdated:**
- Still shows `Favourite` model (removed/replaced by `SavedList`)
- Missing: RecipeReview, SavedList, PantryItem, Flow, UserFlowView, tokens

**Action needed:** Full README rewrite to match current routes, env vars, and data models. Document Redis setup. Document how to set user roles.
