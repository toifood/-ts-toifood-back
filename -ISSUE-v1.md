ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:ts-back 2026-06-07 → GitHub Actions pipeline replaced by Claude skill

Old approach (would-update.yml + would-read-md.js + would-update-content.js + must-update-content.yml) removed in favour of `/would-update` Claude skill running locally via wmux. No Anthropic API key needed — skill runs under Claude Pro. Old files remain in repo pending cleanup decision.
