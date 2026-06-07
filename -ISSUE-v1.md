ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:ts-back 2026-06-07 13:58 → previous entry incorrect — pipeline uses GitHub Actions + self-hosted runner, not wmux

Previous entry stated "skill running locally via wmux" — this was superseded before first run. Final architecture uses GitHub Actions self-hosted runner on Mac Mini (`jayreck` account) dispatching the `/would-update` skill via `claude --dangerously-skip-permissions --print`. No wmux dependency, no `ANTHROPIC_API_KEY` needed.

## ISSUE:ts-back 2026-06-07 13:58 → first run issues resolved — runner group + session conflict

Two issues blocked the first successful run:

**1. Runner group blocked public repos**
`ts-back` is public but Default runner group had `allows_public_repositories: false`. Jobs were silently queued with no runner pickup. Fixed: `gh api --method PATCH orgs/toifood/actions/runner-groups/1 --field allows_public_repositories=true`.

**2. Runner session conflict after auto-update**
Runner auto-updated from v2.325.0 → v2.334.0 on first job pickup. PM2 restart caused a duplicate session error (`A session for this runner already exists`). Fixed: `./config.sh remove` then fresh `./config.sh` registration.

**Hard rules for future runner setup:**
- On a free GitHub org with public repos, always set `allows_public_repositories=true` on the Default runner group immediately after registration
- Never `pm2 restart` the runner while a job is in progress — runner auto-update handles its own lifecycle

## ISSUE:ts-back 2026-06-07 → GitHub Actions pipeline replaced by Claude skill

Old approach (would-update.yml + would-read-md.js + would-update-content.js + must-update-content.yml) removed in favour of `/would-update` Claude skill running locally via wmux. No Anthropic API key needed — skill runs under Claude Pro. Old files remain in repo pending cleanup decision.
