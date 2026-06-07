ASSET LOG - INSTRUCTION
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:instruction {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
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
