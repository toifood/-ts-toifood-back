ASSET LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:instruction {YYYY-MM-DD HH:MM} â†’ {CONTENT}


CUSTOM PROMPT:
Existing docs, README completeness, inline documentation

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:backend 2026-06-22 11:03 → Environment, deploy, and raw-SQL migration instructions are well-established

**`.env.example` is current** — Covers all required env vars: `DATABASE_URL`, `JWT_SECRET`, `AI_PROVIDER`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `PORT`. Operational secrets (`APPSTORE_KEY_ID`, `APPSTORE_ISSUER_ID`, `APPSTORE_PRIVATE_KEY`, `APPSTORE_APP_ID`, `PLAY_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `TOIFOOD_CROSS_REPO_TOKEN`, `GOOGLE_CHAT_WEBHOOK_URL`, `MIN_APP_VERSION`) are not in `.env.example` — these need to be added or kept in a separate ops secrets file.

**Raw-SQL migration pattern is stable** — All schema changes since March 2026 have been applied via `ALTER TABLE` / `CREATE TABLE` + `npx prisma generate`. This is documented in the MIGRATE files and is the established pattern for this environment.

**Legacy route prefix** — `index.ts` keeps all routes mounted at both `/` (legacy, 1-1-0 builds) and `/1-1-1/` (current). Do not remove the legacy prefix until a forced mobile update ships to all users on 1-1-0.

**`scripts/macmini-setup.sh`** is the canonical new-machine setup script. For the jayagent account (Ollama), setup is separate and covered in `docs/openclaw-integration.md` (referenced in README, not present in this repo).
## ASSET:instruction 2026-06-13 18:11 → README has accurate architecture diagram and complete setup walkthrough

README includes a clear ASCII server topology diagram (Cloudflare Tunnel → Mac mini → Node.js/PostgreSQL/Ollama across two accounts) that accurately reflects the deployed architecture. Setup steps cover `npm install`, `.env` configuration, `prisma generate` + `migrate deploy`, dev server, and PM2 production start. `scripts/macmini-setup.sh` covers server provisioning. `.env.example` provides a bootstrapping template. Route files use consistent section-header comments. The `shared/` package provides TypeScript-typed request/response contracts (`GenerateRecipeRequest`, `DietaryFilter`, `RecipeStyle`) shared between frontend and backend. Inline `console.log` prefixes throughout routes serve as informal operation documentation.
## ASSET:instruction 2026-06-13 17:04 → Full env var inventory and shared type exports

**README-documented env vars:**
DATABASE_URL, JWT_SECRET, AI_PROVIDER, OLLAMA_BASE_URL, OLLAMA_MODEL, OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, PORT

**Code-only env vars (not in README):**
| Var | Used in |
|---|---|
| GOOGLE_CHAT_WEBHOOK_URL | src/lib/chat.ts, src/digest.ts |
| SLACK_WEBHOOK_URL | src/lib/slack.ts |
| YOUTUBE_API_KEY | src/services/youtube.ts |
| REDIS_URL | src/middleware/rateLimit.ts, src/services/ai/insights.ts |
| CORS_ORIGIN | src/index.ts |
| MIN_APP_VERSION | src/index.ts |
| APP_WEB_URL | src/routes/recipes.ts |
| APP_URL | src/routes/auth.ts |
| APPSTORE_KEY_ID/ISSUER_ID/PRIVATE_KEY/APP_ID | src/services/appstore.ts |
| PLAY_SERVICE_ACCOUNT_JSON/PLAY_PACKAGE_NAME | src/services/playstore.ts |

**shared/ exports** (shared/src/index.ts):
GenerateRecipeRequest, GenerateRecipeResponse, SaveRecipeRequest, DietaryFilter (enum), RecipeStyle (enum)

**Deployment files:** `scripts/macmini-setup.sh`, `app.json`
## ASSET:instruction 2026-06-09 18:16 â†’ One-file-per-domain route structure makes any endpoint locatable by filename; env var table and deployment guide cover the happy path; CHANGELOG.md provides a human-readable release history

**Predictable route location by filename:**
- `src/routes/` contains one file per domain entity: `recipes.ts`, `auth.ts`, `users.ts`, `pantry.ts`, `lists.ts`, `records.ts`, `insights.ts`, `flows.ts`, `admin.ts`, `chat.ts`. Any endpoint is locatable by reading the filename â€” no route map, no controller index, no grep required. This is the most valuable structural documentation property for onboarding a new developer.

**Happy-path deployment fully documented:**
- `docs/macmini-deployment.md` covers the complete Mac mini M4 setup: PostgreSQL, Redis, Ollama, pm2, env vars, `prisma migrate deploy`, and pm2 start command. A developer starting from scratch has a complete checklist for the primary deployment target.
- `docs/openclaw-integration.md` explains the Ollama local AI model integration â€” including model name (`qwen2.5:7b`) and the URL the API expects (`http://127.0.0.1:11434`).

**CHANGELOG.md as a release reference:**
- `CHANGELOG.md` is tracked in the repo â€” version history is available alongside the code rather than in a separate wiki. This is a low-cost asset for understanding what changed between versions without reading git log.

## ASSET:instruction 2026-06-09 18:03 â†’ Shared TypeScript types provide implicit API contract; /health + /app-config enable client-side resilience; docs/ folder contains deployment and AI integration guides

**Shared TypeScript types as living API contract:**
- `shared/src/index` exports `GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle` â€” these are the canonical types shared between the backend and mobile clients. Changes to these types surface as TypeScript compile errors on the client side before deployment, providing a built-in breaking-change detection mechanism.

**Self-describing operational endpoints:**
- `GET /health` â†’ `{ status: "ok", timestamp }` â€” suitable for load balancer health checks and uptime monitoring without authentication
- `GET /app-config` â†’ `{ minVersion }` â€” mobile clients can enforce minimum app version using `MIN_APP_VERSION` env var. This is the documented mechanism for forcing users off outdated builds.
- `GET /recipes/usage` â€” clients can display live quota remaining without any additional configuration

**docs/ folder covers deployment and AI:**
- `docs/macmini-deployment.md` â€” complete Mac mini M4 setup guide (pm2, PostgreSQL, Redis, Ollama)
- `docs/openclaw-integration.md` â€” Ollama local AI model integration guide
- `CHANGELOG.md` â€” version history available for release notes

**Route structure is navigable:**
- All routes are in `src/routes/` with one file per domain (recipes, auth, users, pantry, lists, records, insights, flows, admin, chat) â€” new developers can locate any endpoint by filename without grepping.
## ASSET:instruction 2026-06-07 16:30 â†’ Versioned route structure (1-1-1 prefix) established; legacy routes maintained; health and app-config endpoints stable

**Route versioning pattern (1-1-1 branch):**
- New route prefix: `/1-1-1/{auth|api|system}/` â€” separates auth, REST API, and system endpoints
- System endpoints: `/1-1-1/system/health`, `/1-1-1/system/admin`, `/1-1-1/system/flows`, `/1-1-1/system/stats` (redirects), `/1-1-1/system/app-config` (redirects)
- Legacy unversioned paths kept alive until old app builds phase out (comment in `src/index.ts` documents this explicitly)

**Self-documenting elements:**
- `GET /1-1-1/system/health` â†’ `{ status: "ok", timestamp }` â€” suitable for uptime monitoring
- `GET /app-config` â†’ `{ minVersion }` â€” client can enforce minimum app version via `MIN_APP_VERSION` env var
- `GET /recipes/usage` â†’ per-user rate limit state â€” documents quota to the client in real time
- All routes use TypeScript interfaces for request/response bodies â€” types in `shared/src/index` serve as implicit API contract

**Deployment docs (external, not in branch):**
- `docs/macmini-deployment.md` â€” Mac mini M4 setup
- `docs/openclaw-integration.md` â€” Ollama AI model integration
- `CHANGELOG.md` â€” version history
## ASSET:instruction 2026-06-07 10:00 â†’ Setup docs: README + docs/macmini-deployment.md + docs/openclaw-integration.md; current env vars and run commands

**Developer setup (from README + codebase):**

```bash
npm install
cp .env.example .env   # edit .env
npx prisma generate
npx prisma migrate deploy
npm run dev            # ts-node on :3000
```

**Required env vars** (beyond README):

| Variable | Required | Notes |
|---|---|---|
| DATABASE_URL | yes | PostgreSQL |
| JWT_SECRET | yes | |
| REDIS_URL | yes | Rate limiting â€” defaults to redis://localhost:6379 |
| AI_PROVIDER | no | ollama (default) / openai / claude |
| OLLAMA_BASE_URL | no | Default http://127.0.0.1:11434 |
| OLLAMA_MODEL | no | Default qwen2.5:7b |
| OPENAI_API_KEY | if AI_PROVIDER=openai | |
| ANTHROPIC_API_KEY | if AI_PROVIDER=claude | |
| GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET | no | Google OAuth |
| APP_URL | no | OAuth callback base; defaults to https://api.toifood.co.nz |
| CORS_ORIGIN | no | Comma-separated; defaults to toifood.co.nz, app.toifood.co.nz |
| PORT | no | Default 3000 |

**Production (Mac mini M4):**
```bash
npm run build
pm2 start dist/src/index.js --name toifood-back
```

**Reference docs:**
- `docs/macmini-deployment.md` â€” full Mac mini setup guide
- `docs/openclaw-integration.md` â€” Ollama/local AI model integration
