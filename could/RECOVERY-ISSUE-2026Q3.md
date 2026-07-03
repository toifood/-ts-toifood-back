ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:recovery 2026-07-04 07:06 → Single Mac mini is the whole blast radius: no documented DB backup, local-only metrics, fail-open rate limiting during Redis outages

**No backup story for PostgreSQL** — Nothing in the repo (scripts, docs, cron) performs or documents `pg_dump`/replication. The DB holds all users, recipes, tokens, cook records, and OG image blobs on one machine's disk; a disk failure is total, unrecoverable data loss. The `ogImage Bytes` blobs also make any future dump/restore disproportionately slow.

**Metrics survive only on that disk** — `would/*.csv` (RECIPE, DISCOVER, DIGEST) are local-only; only AUTH-METRIC is pushed offsite to GitHub. The analytical history the digest and quarterly reviews depend on has no copy.

**Redis outage silently disables abuse protection — `src/middleware/rateLimit.ts`**
Rate limiting fails open by design ("Redis unavailable, skipping"). Reasonable for UX, but during a Redis outage every user gets unlimited Claude generations with only a console warn — no alert fires, so a multi-hour outage is also an uncapped spend window.

**Recovery runbook is a dead link** — README points to `docs/macmini-deployment.md`, which is not in the repo. If the machine dies, rebuild knowledge is `scripts/macmini-setup.sh` plus memory.

**Secret rotation = mass logout** — JWTs are 7-day tokens signed with a single `JWT_SECRET`; rotation (e.g. after a leak) invalidates every session with no dual-key grace mechanism, and Apple/Google-linked accounts with no password would churn hardest.
