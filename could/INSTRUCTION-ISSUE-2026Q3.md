ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:instruction 2026-07-04 07:06 → README documents a removed API surface and links to docs that aren't in the repo

**README API section is a Q1 snapshot — `README.md`**
- Documents `/favourites` endpoints, but the Favourite table was dropped in migration `20260414000000_remove_favourite_table`; saved lists replaced it and are undocumented.
- Missing entirely: `/auth/apple`, password reset + email verification flows, `/recipes/discover`, `/recipes/:id/share` + public share/og-image endpoints, `/recipes/usage`, note PATCHes, reviews, `/lists`, `/pantry`, `/insights`, `/records` (cook funnel), `/store-metrics`, `/users/me/privacy`, `/users/:id/profile`, `/stats`, `/app-config`.
- No mention of the `/1-1-6/` versioned prefix — every documented path is the legacy mount.
- Data model section lists 4 models (including the deleted `Favourite`); the schema has 11.

**Broken doc links** — README links `docs/macmini-deployment.md`, `docs/openclaw-integration.md`, and `CHANGELOG.md`; none exist in the repo tree. The deployment knowledge for the Mac mini setup lives nowhere versioned except `scripts/macmini-setup.sh`.

**Env var table incomplete** — code reads `REDIS_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `YOUTUBE_API_KEY`, `GOOGLE_CHAT_WEBHOOK_URL`, `SLACK_WEBHOOK_URL`, `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `APPSTORE_*` (4 vars), `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `TOIFOOD_CROSS_REPO_TOKEN`, `CORS_ORIGIN`, `MIN_APP_VERSION`, `APP_WEB_URL`, `APP_URL` — the README table documents none of these, so a fresh deploy silently loses email, alerts, video search, and store metrics.
