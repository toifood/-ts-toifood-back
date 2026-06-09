ASSET LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:instruction {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:instruction 2026-06-09 18:03 → Shared TypeScript types provide implicit API contract; /health + /app-config enable client-side resilience; docs/ folder contains deployment and AI integration guides

**Shared TypeScript types as living API contract:**
- `shared/src/index` exports `GenerateRecipeRequest`, `GenerateRecipeResponse`, `DietaryFilter`, `RecipeStyle` — these are the canonical types shared between the backend and mobile clients. Changes to these types surface as TypeScript compile errors on the client side before deployment, providing a built-in breaking-change detection mechanism.

**Self-describing operational endpoints:**
- `GET /health` → `{ status: "ok", timestamp }` — suitable for load balancer health checks and uptime monitoring without authentication
- `GET /app-config` → `{ minVersion }` — mobile clients can enforce minimum app version using `MIN_APP_VERSION` env var. This is the documented mechanism for forcing users off outdated builds.
- `GET /recipes/usage` — clients can display live quota remaining without any additional configuration

**docs/ folder covers deployment and AI:**
- `docs/macmini-deployment.md` — complete Mac mini M4 setup guide (pm2, PostgreSQL, Redis, Ollama)
- `docs/openclaw-integration.md` — Ollama local AI model integration guide
- `CHANGELOG.md` — version history available for release notes

**Route structure is navigable:**
- All routes are in `src/routes/` with one file per domain (recipes, auth, users, pantry, lists, records, insights, flows, admin, chat) — new developers can locate any endpoint by filename without grepping.
## ASSET:instruction 2026-06-07 16:30 → Versioned route structure (1-1-1 prefix) established; legacy routes maintained; health and app-config endpoints stable

**Route versioning pattern (1-1-1 branch):**
- New route prefix: `/1-1-1/{auth|api|system}/` — separates auth, REST API, and system endpoints
- System endpoints: `/1-1-1/system/health`, `/1-1-1/system/admin`, `/1-1-1/system/flows`, `/1-1-1/system/stats` (redirects), `/1-1-1/system/app-config` (redirects)
- Legacy unversioned paths kept alive until old app builds phase out (comment in `src/index.ts` documents this explicitly)

**Self-documenting elements:**
- `GET /1-1-1/system/health` → `{ status: "ok", timestamp }` — suitable for uptime monitoring
- `GET /app-config` → `{ minVersion }` — client can enforce minimum app version via `MIN_APP_VERSION` env var
- `GET /recipes/usage` → per-user rate limit state — documents quota to the client in real time
- All routes use TypeScript interfaces for request/response bodies — types in `shared/src/index` serve as implicit API contract

**Deployment docs (external, not in branch):**
- `docs/macmini-deployment.md` — Mac mini M4 setup
- `docs/openclaw-integration.md` — Ollama AI model integration
- `CHANGELOG.md` — version history
## ASSET:instruction 2026-06-07 10:00 → Setup docs: README + docs/macmini-deployment.md + docs/openclaw-integration.md; current env vars and run commands

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
| REDIS_URL | yes | Rate limiting — defaults to redis://localhost:6379 |
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
- `docs/macmini-deployment.md` — full Mac mini setup guide
- `docs/openclaw-integration.md` — Ollama/local AI model integration
