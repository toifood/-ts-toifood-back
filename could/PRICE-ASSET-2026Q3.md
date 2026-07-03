ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:price 2026-07-04 07:06 → Cost model: near-zero infra, Claude Haiku as the only metered marginal cost, role-tiered limits as the control

**Infra: effectively fixed-cost** — Self-hosted Mac mini M4 runs Node, PostgreSQL, Redis, and Ollama (`qwen2.5:7b`); Cloudflare Tunnel and the Gmail SMTP relay are free tiers. Marginal infra cost per user ≈ electricity.

**AI spend model**
- Default provider is local Ollama → $0 per generation; this is the free-tier product path.
- Claude path uses `claude-haiku-4-5-20251001` with `max_tokens: 2048` and a ~300-token prompt — the cheapest current Anthropic tier, and the only per-request billable in the system.
- Daily caps enforced in Redis per user/provider: free 3 ollama / 2 claude, premium 10 / 5. Worst-case daily Anthropic exposure is therefore bounded by `(premium users × 5 + free users × 2)` Haiku calls — predictable and small.
- Claude→Ollama fallback means Anthropic outages cost nothing extra and don't break the product.

**Cost telemetry already in place** — `RECIPE-METRIC.csv` records `requestedProvider`, `usedProvider`, `fallback`, and `responseMs` per generation, and the daily digest posts per-model counts to Google Chat — enough to reconstruct Anthropic spend per day without touching the billing console. Insight generation and digest summaries deliberately use local Ollama, keeping all background AI at $0.
