ISSUE LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:instruction {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
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
