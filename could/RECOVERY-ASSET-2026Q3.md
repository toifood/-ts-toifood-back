ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:recovery 2026-07-04 07:06 → Resilience assets: pm2 supervision, crash guards, degradation matrix, reproducible schema, remote ops bots

- **Process survival** — pm2 supervises `toifood-back`; `uncaughtException`/`unhandledRejection` hooks in `index.ts` log instead of crash, and pm2 restarts cover the rest (`restart_time` surfaced via `!status`).
- **Health & monitoring endpoints** — `/health` and `/1-1-6/system/health` for tunnel/uptime checks; request-log middleware gives per-request forensics in pm2 logs.
- **Graceful-degradation matrix** — Redis down → rate limit skipped, usage endpoint returns defaults; Ollama down → Claude requests still work, Ollama requests fail with alert; Claude down → automatic Ollama fallback; YouTube down → recipes save without video; email service down → forgot-password swallows the error; DB blip on `/stats` → stale cache served; missing OG image → startup-generated placeholder.
- **Alerting** — `chatAlert`/`slackAlert` push generation failures and Apple auth failures to ops channels in real time; daily digest summarizes error logs and Ollama infra health (metal/KV-cache snapshots) automatically.
- **Remote ops without SSH** — Slack bot (Socket Mode) and Google Chat endpoint expose `!status` / `!logs` / `!metrics` for diagnosis from a phone.
- **Reproducible schema** — full migration chain + `migrate deploy` + `scripts/macmini-setup.sh` can rebuild an empty-but-correct environment; `.env.example` enumerates the baseline config; AUTH-METRIC's GitHub push is the one existing offsite data copy pattern, ready to extend to the other CSVs.
