SHOULD ISSUE LOG
prompt: review and update disaster recovery procedures, rollback plans, backup strategies, incident response runbooks
path: should/RECOVERY-ISSUE-2026Q2.md
target: ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:RECOVERY {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:RECOVERY 2026-06-28 18:28 ▸ No automated backup for PostgreSQL or Redis; single Mac mini host with no documented failover or Prisma rollback procedure

**No database backup strategy**: No `pg_dump` scripts, backup cron jobs, or references to cloud backup destinations (S3, Backblaze, etc.) are present in the repository. PostgreSQL 16 runs locally on the Mac mini (`scripts/macmini-setup.sh`). A hardware failure or accidental `DROP TABLE` would result in unrecoverable data loss.

**Redis persistence undocumented**: `dump.rdb` is committed to the repo root — indicating Redis RDB persistence is enabled, but there is no documented restore procedure, no backup schedule, and no offsite copy. The file in git is a snapshot, not a live backup.

**Single-host deployment**: The entire stack (Node.js, PostgreSQL, Redis) runs on one Mac mini. There is no secondary host, no read replica, and no failover automation. Downtime for any hardware or OS issue requires manual intervention.

**`macmini-setup.sh` hardcoded path**: Line 3 of the setup script references `/Users/jayagent/Documents/GitHub/ts-toifood-back/scripts/macmini-setup.sh` — tied to a specific username and directory. A rebuild on a different user account would require script edits before it is usable.

**Health endpoint does not probe dependencies**: `GET /health` returns `{status:"ok"}` regardless of DB or Redis state. Uptime monitors will report the service as healthy even during a DB connection failure or Redis outage.

**No Prisma migration rollback procedure**: Migrations are forward-only. No runbook exists for reverting a failed migration in production, requiring manual SQL or a database restore from backup (which itself is not automated).

**No PM2 ecosystem file in repo**: Process management (auto-restart on crash, log rotation, startup on boot) is not formally defined as code. Recovery after a Node.js crash or Mac mini reboot depends on undocumented manual steps.
