ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Billing edge cases, subscription state mismatches, failed charge handling

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:price 2026-06-08 10:00 â†’ Rate limit race fixed; Redis silent-bypass and insight cost runaway still open; no billing integration

**Fixed since Q2:**
- Rate limit INCR/EXPIRE race resolved with atomic Lua script â€” two concurrent requests can no longer both see `count===1` and leave the Redis key without an expiry

**Remaining open risks:**
- Redis failure still silently disables all rate limiting with only a `console.warn` â€” no Slack alert fires; a Redis outage means unbounded Ollama/Claude calls with no operator notification
- `runInsightAnalysis()` runs server-side with no per-user rate limit or cost cap â€” if triggered on high-frequency events, AI API cost accumulates without any per-call metering
- YouTube API quota is consumed on every recipe save with no tracking or alerting when quota is exhausted
- `premium` role has no billing backend â€” role can only be set via DB or admin API; no subscription management, no payment webhook, no automated downgrade on lapsed payment
- No token-level cost logging for Claude or OpenAI providers â€” cost per recipe is unknown from DB data alone