ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:ts-back 2026-06-07 16:00 → BUG and ANALYSIS categories added — pipeline now 7 categories × 14 docs

Two new analysis categories added to the would-update pipeline:

| Category | ISSUE prompt | ASSET prompt |
|---|---|---|
| `bug` | Undiscovered bugs — edge cases, race conditions, null dereferences, async pitfalls | Existing bug-prevention assets — error handling, validation, defensive code |
| `analysis` | Overall code quality — technical debt, architectural concerns, scalability | Codebase health summary — what's well-built, prod-ready, engineering strengths |

Prompts embedded directly in skill (`would-update.md`) — no `-MUST/` files needed for these two.

**Files added to `would/`:** `BUG-ISSUE-V1.md`, `BUG-ASSET-V1.md`, `ANALYSIS-ISSUE-V1.md`, `ANALYSIS-ASSET-V1.md`

**Updated:** `would-update-content.js` (4 new env vars), `would-update-csv.js` (CATEGORIES now 7), `would-read-md.js` (embedded prompts for bug/analysis).

## ASSET:ts-back 2026-06-07 16:00 → skill branch detection fixed — reads newest created branch of ts-toifood-back

Skill now correctly identifies the most recently created branch of `ts-toifood-back` using `compare/main...{branch}` to find each branch's creation date. Previously used `zipball/latest` which resolved to `main` (no `-MUST/`), silently skipping all 5 standard category prompts.
## ASSET:ts-back 2026-06-07 14:16 → file structure aligned to toiflow/ts-anz pattern

**Four JS files (mirrors ts-anz):**
| File | Role |
|---|---|
| `would-read-md.js` | Reads `-MUST/` instruction files + codebase context, builds 10 prompts |
| `would-update-md.js` | Local runner — invokes `/would-update ts-back` skill via `claude --print` |
| `would-update-content.js` | Writes 10 analyses to `would/` files via GitHub API (JS pipeline fallback) |
| `would-update-csv.js` | Reads `would/` files, extracts latest entry headlines, appends to `would/-log-codebase-v1.csv` |

**Output files moved to `would/` (mirrors ts-anz `would/` pattern):**
- `{category}-ISSUE.md` / `{category}-ASSET.md` at root → `would/{category}-issue-v1.md` / `would/{category}-asset-v1.md`
- Added `would/-log-codebase-v1.csv` — weekly headline log

**Skill updated:** target paths changed from `$GITHUB_WORKSPACE/{category}-ISSUE.md` → `$GITHUB_WORKSPACE/would/{category}-issue-v1.md`

**Workflow updated:** CSV step added after skill run — `node would-update-csv.js` → `git commit + push`

## ASSET:ts-back 2026-06-07 13:58 → pipeline fully operational — first run confirmed 2026-06-07 13:55

**First successful run:** `f5d3ecf` committed to `toifood/ts-back` at 2026-06-07 13:55 — "would-update: 2026-06-07 13:55 codebase analysis"

**Final pipeline state:**

| Component | Value |
|---|---|
| Trigger | GitHub Actions schedule — weekly Monday 06:00 UTC (18:00 NZST) |
| Runner | `[self-hosted, mac-mini]` — `jayreck` account, PM2 process `toifood-runner` |
| Runner version | 2.334.0 (auto-updated on first run from 2.325.0) |
| Skill | `/would-update ts-back` via `claude --dangerously-skip-permissions --print` |
| Skill source | Auto-copied from `toifood/-toifood/.claude/commands/would-update.md` on each run |
| Auth | Claude Pro OAuth — `~/.claude/` persisted on Mac Mini under `jayreck` |
| Cross-repo token | `TOIFOOD_CROSS_REPO_TOKEN` org secret — downloads `ts-toifood-back@latest` zip |
| Output | 10 category docs updated (migrate/price/recovery/usage/instruction × ISSUE/ASSET) |
| Commit | Skill commits directly from `$GITHUB_WORKSPACE` using `actions/checkout` credentials |

**Workflow steps (would-update.yml):**
1. `actions/checkout@v4` — ts-back with `TOIFOOD_CROSS_REPO_TOKEN`
2. `actions/checkout@v4` — `toifood/-toifood` into `_toifood/`
3. Install skill — `cp _toifood/.claude/commands/would-update.md ~/.claude/commands/`
4. Run skill — `claude --dangerously-skip-permissions --print "/would-update ts-back"`

**No API key required.** Claude Pro covers all LLM inference via OAuth auth on Mac Mini.

## ASSET:ts-back 2026-06-07 → 10 category docs created + /would-update skill wired

10 category analysis docs created (migrate, price, recovery, usage, instruction × ISSUE/ASSET). All follow the anchor-marker format — new entries prepend at top, never edit previous.

Skill: `-toifood/.claude/commands/would-update.md` — invoked as `/would-update ts-back`. Downloads `ts-toifood-back@latest` tarball via `gh api` (no clone), reads -MUST/ prompts + codebase context, generates 10 analyses, writes to category docs, commits and pushes.
## ASSET:ts-back 2026-06-07 → initial pipeline created

| File | Purpose |
|---|---|
| `.github/workflows/would-update.yml` | Fetch + 10 parallel Claude jobs + update |
| `would-read-md.js` | Reads `-MUST/` files + codebase from `ts-toifood-back@1-1-1`, builds 10 prompts |
| `would-update-content.js` | Writes Claude responses to `would/` files via GitHub API |

**Categories:** migrate, price, recovery, usage, instruction — each generates issue + asset output.

**Source repo:** `jayreck996/ts-toifood-back@1-1-1` — checked out via `TOIFOOD_CROSS_REPO_TOKEN`.

**Pending:** `ANTHROPIC_API_KEY` org secret before first run.
