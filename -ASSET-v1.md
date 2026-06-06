ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:ts-back 2026-06-07 → initial pipeline created

| File | Purpose |
|---|---|
| `.github/workflows/would-update.yml` | Fetch + 10 parallel Claude jobs + update |
| `would-read-md.js` | Reads `-MUST/` files + codebase from `ts-toifood-back@1-1-1`, builds 10 prompts |
| `would-update-content.js` | Writes Claude responses to `would/` files via GitHub API |

**Categories:** migrate, price, recovery, usage, instruction — each generates issue + asset output.

**Source repo:** `jayreck996/ts-toifood-back@1-1-1` — checked out via `TOIFOOD_CROSS_REPO_TOKEN`.

**Pending:** `ANTHROPIC_API_KEY` org secret before first run.
