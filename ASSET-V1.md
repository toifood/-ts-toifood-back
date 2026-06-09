ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:ts-back 2026-06-09 → would-update split: Claude skill = read+analyze, would-update-content.js = write

**Quarter fix shipped (`-toifood` commit `6ea7df4`):** `would-update.md` Step 0 now computes `$QUARTER` from `QUARTER_OVERRIDE` or current date — matching ts-anz/ts-inbox pattern. Next regular Monday run targets Q2 correctly.

**Architecture — clean split implemented:**
- Claude skill (`would-update.md`): reads source codebase, generates 14 analyses, writes each to `/tmp/would-results/{category}-{type}.txt`
- `would-update-content.js` (rewritten): reads temp files, `getOrCreate()` each `could/` doc with header+anchor on first write, inserts entry below anchor via GitHub API — consistent with ts-anz/ts-inbox pattern
- `would-update.yml`: `setup-node` moved before skill; new `Write to docs` step runs `would-update-content.js` between skill and CSV

**getOrCreate pattern:** file missing → PUT with full ISSUE/ASSET header (owned in `would-update-content.js`, not in shared timing workflow). No dependency on `must-update-timing.yml` for `.md` file initialisation.

**Simplification direction (pending):** `must-update-timing.yml` to become suffix-only — remove `.md` creation, keep quarter computation + CSV init only. Each repo's `would-update-content.js` now owns its header constants.
## ASSET:ts-back 2026-06-07 → error code reference — all routes

All error responses follow `{ error: string, code: string, ...extras }`. Frontend can switch on `code` without parsing error strings.

**Shared codes (appear in multiple routes):**
| Code | Meaning |
|---|---|
| `MISSING_FIELDS` | Required field absent or wrong type |
| `FORBIDDEN` | Auth passed but action not allowed |
| `SERVER_ERROR` | Unexpected internal failure |
| `RECIPE_NOT_FOUND` | Recipe absent or not owned by user |
| `EMAIL_EXISTS` | Email already registered / in use |
| `PASSWORD_INVALID` | Length outside 8–128 chars |
| `USER_NOT_FOUND` | Authenticated user missing from DB |

**Route-specific codes:**
| Code | Route | Trigger |
|---|---|---|
| `EMAIL_TOO_LONG` | auth | email > 100 chars |
| `NAME_TOO_LONG` | auth | name > 50 chars |
| `AUTH_ERROR` | auth | Passport internal error |
| `INVALID_CREDENTIALS` | auth | Wrong email or password |
| `APPLE_KEY_NOT_FOUND` | auth | No matching JWKS key for Apple token |
| `APPLE_AUTH_FAILED` | auth | Apple JWT verify threw |
| `GOOGLE_AUTH_FAILED` | auth | Google callback user absent |
| `TOKEN_INVALID` | auth | Verify/reset token expired or not found |
| `FILTERS_INVALID` | users | filters not an array |
| `FILTERS_LIMIT_EXCEEDED` | users | > 3 dietary filters |
| `PRIVACY_INVALID` | users | privacy field not boolean |
| `AGE_RANGE_INVALID` | users | ageRange not in enum |
| `GENDER_INVALID` | users | gender not in enum |
| `PASSWORD_INCORRECT` | users | currentPassword wrong |
| `OAUTH_ACCOUNT` | users | tried to set password on OAuth account |
| `INGREDIENTS_INVALID` | recipes | all ingredients empty after sanitisation |
| `INGREDIENT_LIMIT_EXCEEDED` | recipes | > 50 ingredients |
| `GENERATION_FAILED` | recipes | AI provider threw |
| `NOTE_INVALID` | recipes | note field wrong type |
| `NOTE_TOO_LONG` | recipes | note > 500 chars |
| `STARS_INVALID` | recipes | stars not integer 1–5 |
| `RECIPE_NOT_SHARED` | recipes | unshare called on non-shared recipe |
| `RECORD_NOT_FOUND` | cookRecords | cook record absent or not owned |
| `LISTS_LIMIT_EXCEEDED` | lists | > 5 custom lists |
| `LIST_NOT_FOUND` | lists | list absent or not owned |
| `STATUS_INVALID` | insights | status not accepted/dismissed |
| `INSIGHT_NOT_FOUND` | insights | insight absent or not owned |
| `INSIGHT_RESOLVED` | insights | insight already accepted/dismissed |
| `TRIGGER_INVALID` | admin | trigger not first_login/manual |
| `INVALID_INGREDIENT` | pantry | ingredient empty/missing |
| `INGREDIENT_EXISTS` | pantry | ingredient already in pantry |
| `PANTRY_LIMIT_EXCEEDED` | pantry | pantry at 50-item cap |

## ASSET:ts-back 2026-06-07 → pantry cap — 50 items

`PANTRY_CAP = 50` in `src/routes/pantry.ts`. Returns `400 PANTRY_LIMIT_EXCEEDED` with `{ limit: 50, count }` when exceeded.

## ASSET:ts-back 2026-06-07 → bug fix reference — ts-toifood-back branch 1-1-1

Fixes applied via BUG-ISSUE-V1 skill analysis. Build clean, pushed to `jayreck996/ts-toifood-back` branch `1-1-1`.

| Fix | File | Detail |
|---|---|---|
| Apple JWKS cache | `src/routes/auth.ts` | `getCachedAppleKeys()` — module-level cache, 1hr TTL, prevents N concurrent `appleid.apple.com/auth/keys` fetches |
| XSS in password reset | `src/routes/auth.ts` | `escHtml()` escapes `&`, `<`, `>`, `"` before HTML interpolation of `token` and `msg` |
| Atomic rate limit | `src/middleware/rateLimit.ts` | Lua: `INCR` + `EXPIRE` in single round-trip — eliminates race where two requests both see `count===1` |
| Unhandled promise | `src/routes/recipes.ts` | `void initPlaceholder()` — startup race on OG image placeholder removed |
| Plural stem matching | `src/routes/cookRecords.ts` | `pluralStem()` rewritten — irregular map (eggs→egg, geese→goose), `-ee` invariant guard (cheese stays cheese), safer `s`-strip |

## ASSET:ts-back 2026-06-07 17:30 → could/ and would/ split by file type

| Directory | File types | Contents |
|---|---|---|
| `could/` | `.md` | 14 category analysis docs (MIGRATE/PRICE/RECOVERY/USAGE/INSTRUCTION/BUG/ANALYSIS × ISSUE/ASSET) |
| `would/` | `.csv`, `.log` | `skill-metric-v1.csv` — weekly headline log |

`would-update-csv.js` reads `.md` from `could/`, writes CSV to `would/`. Workflow `git add` targets `would/skill-metric-v1.csv`.
## ASSET:ts-back 2026-06-07 17:00 → output directory renamed would/ → could/

All 14 category docs moved from `would/` to `could/`. JS files, workflow, and skill all updated to match. `could/log-asset-v1.csv` is the weekly CSV headline log path (file not yet committed — needs to be added).

## ASSET:ts-back 2026-06-07 17:00 → ts-toifood-back log files renamed to uppercase

Runtime log files in `~/ts-toifood-back/logs/` renamed and source references updated:

| Before | After |
|---|---|
| `recipe-metrics.csv` | `RECIPE-METRIC.csv` |
| `discover-metrics.csv` | `DISCOVER-METRIC.csv` |
| `digest-log.csv` | `DIGEST-METRIC.csv` |
| `memory-metrics.csv` | `MEMORY-METRIC.csv` |
| `digest.log` | `DIGEST-LOG.log` |
| `store-report.log` | `STORE-LOG.log` |

Updated in: `src/routes/recipes.ts`, `src/routes/chat.ts`, `src/digest.ts`, `src/slack-bot.ts`. Rebuilt `dist/`. Pushed to branch `1-1-1`.
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
