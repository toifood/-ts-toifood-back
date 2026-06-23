ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:backend 2026-06-22 11:03 → pluralStem duplicated with divergent logic, storeReport.ts references archived paths, and no runtime request-body validation
## ISSUE:back 2026-06-23 15:14 → Dual-provider AI architecture with local Ollama default and Claude Haiku premium tier

The backend uses a two-tier AI strategy: Ollama (`qwen2.5:7b`, local Mac Mini) as the free default and `claude-haiku-4-5-20251001` as the premium path. When Claude fails, `src/routes/recipes.ts` falls back to Ollama and sets `fallback=true` in the RECIPE-METRIC CSV.

Key architectural observations:
- **Rate limiting** (`src/middleware/rateLimit.ts`): Redis-backed with a Lua atomic INCR+EXPIRE script to prevent race conditions. Free: 3 Ollama + 2 Claude /hr; Premium: 10 + 5; Admin: unlimited. Fails open on Redis unavailability.
- **Metrics**: Auth, recipe, and discover events are appended to local CSV files under `would/`. Auth events additionally push to GitHub (`toifood-dev/ts-toifood-dev`) via REST with retry on 409.
- **OG images**: Server-generated at recipe-generate time using `@napi-rs/canvas`, then stored as `Bytes` in the `Recipe` table. Older recipes fall back to a startup-generated placeholder.
- **Insights pipeline** (`src/services/ai/insights.ts`): Triggered fire-and-forget after every recipe save. A Redis key enforces a 7-day per-user cooldown. Five categories: dietary, cuisine, style, pantry, mealType. Uses Ollama for personalised suggestion copy.
- **Stats endpoint**: Simple 60-second in-memory cache (`let statsCache`) — single-process safe for Mac Mini deployment.
- **Legacy routes**: The 1-1-0 path (`/recipes`, `/auth`, etc.) is still mounted alongside `/1-1-1/api/*`. Comment in `src/index.ts` says to keep alive until old app builds phase out.
- **Pantry stem matching**: Two separate `pluralStem` implementations exist — a simple one in `src/routes/recipes.ts` and a more robust one with irregular plurals in `src/routes/cookRecords.ts`.

---
## ISSUE:backend 2026-06-23 14:32 -> Five new concerns — insights fire 5 parallel Ollama calls, CookRecord no dedup, insights auto-apply race, legacy routes persist, digest.ts missing mkdir guard

**1. `src/services/ai/insights.ts` fires up to 5 simultaneous Ollama requests per user**
`runInsightAnalysis()` runs all active analyzers via `Promise.allSettled`, each calling `ollamaSuggest()` — a fetch to the local Ollama instance. On the Mac Mini M4 this means up to 5 concurrent LLM inference loads per triggered user. No concurrency cap or queue exists. A user with enough recipes hitting the weekly cooldown expiry will saturate the GPU Metal buffer at the same time as recipe generation.

**2. `POST /records/start` allows duplicate in-progress records** (`src/routes/cookRecords.ts`)
No uniqueness guard prevents a user from calling `/start` multiple times for the same recipe. Concurrent taps or retries create multiple `STARTED` records that never transition unless `complete` or `abandon` is explicitly called. No TTL or sweep moves stale `STARTED` records to `ABANDONED`.

**3. Insights accept race condition** (`src/routes/insights.ts`)
`PATCH /insights/:id` with `status: "accepted"` auto-applies a dietary filter after checking `existing.length < 3`. Two concurrent accepts for different insights both pass the check and both call `create`, pushing the user past 3 filters and bypassing the cap enforced in `PATCH /users/me/preferences`.

**4. Legacy routes still alive with no sunset mechanism**
`src/index.ts` still mounts `/auth`, `/recipes`, `/users`, etc. alongside `/1-1-1/` versions. No app-version telemetry, no date, no deprecation metric to detect when legacy clients are gone.

**5. `src/digest.ts` writes `would/DIGEST-METRIC.csv` without a mkdir guard**
`recipes.ts` uses `fs.mkdirSync(dir, { recursive: true })` before writing metrics. `digest.ts` uses `fs.appendFileSync` directly with no directory existence check — if `would/` is absent on a fresh deploy or restore, the digest process throws and no Google Chat alert is posted.
## ISSUE:backend 2026-06-23 11:23 → Dual-route legacy layer, code duplication in ops tools, and unverified-user gap

The codebase maintains a full duplicate route tree under `/` (1-1-0 legacy) alongside `/1-1-1/` (current), with no sunset mechanism, deprecation header, or timeline — both route sets remain live indefinitely. `src/routes/chat.ts` and `src/slack-bot.ts` share three identical helper functions (`getPm2Status`, `getRecentLogs`, `getMetricsSummary`) with no shared module. `POST /auth/register` returns a valid JWT without sending a verification email; `emailVerified` is never enforced as an access gate anywhere in the API, making the field effectively decorative. `storeReport.ts` still references a `-ARCHIVE/-WOULD/` file path that does not exist in the standard deployment layout and will silently fail at runtime.

---
## ISSUE:backend 2026-06-22 20:06 -> Four new architectural concerns — unauthenticated chat bot, missing register verification email, DIGEST-METRIC never surfaced, emoji lastIndexOf picks later-occurring general terms

**1. `/api/chat` POST has no authentication**
`src/routes/chat.ts` registers the Google Chat bot endpoint without `requireAuth` middleware and without Google Chat request signature verification. `!status`, `!logs`, and `!metrics` commands expose PM2 process names, memory usage, recent error log lines, and today's metric counts to any HTTP client that discovers the URL. The route is registered under both `/1-1-1/api/chat` and legacy `/chat`.

**2. `POST /auth/register` never sends a verification email**
`src/routes/auth.ts:1161-1169` creates the user (`emailVerified: false`), issues a JWT, and returns 201 — `sendVerificationEmail` is imported but never called in this handler. Users register and receive a fully-functional token without verifying their email. The only path to a verification link is manually calling `POST /auth/resend-verification`.

**3. `DIGEST-METRIC.csv` is written but never read or reported**
`src/digest.ts` calls `appendDigestLog` on every daily run, writing recipe counts, avg response ms, Ollama status, and memory metrics to `would/DIGEST-METRIC.csv`. This file is never read back by any route, chat command, or the digest itself. The structured data is dark — operators cannot access it without SSHing to the Mac Mini.

**4. `inferEmojiFromTitle` uses `lastIndexOf` — later-occurring general terms can beat earlier specific ones**
`src/services/ai/provider.ts:3390-3402` picks the keyword with the highest `lastIndexOf` position in the title string. For "Beef Chili Noodle Soup", `soup` at pos 19 beats `noodle` at pos 11 and `chili` at pos 5 — returning 🍲 instead of 🍜. The array ordering comment ("most-specific first") only breaks ties at equal positions, not across positions.
## ISSUE:analysis 2026-06-22 11:51 → Dual route registration and auth-metrics GitHub write create operational risk

All routes are registered twice — once under `/1-1-1/...` (versioned) and once at the legacy bare path — with no plan or timeline for retiring the old prefix. `src/auth.ts` fires a GitHub API GET+PUT on every login/register event to push rows to `ts-toifood-dev`; concurrent auth bursts create 409 races (retried once then silently dropped), meaning auth metric data can be silently lost. The `initPlaceholder()` OG image call at startup catches all errors and leaves `placeholderOgImage` as `null`, so failed startups serve an empty buffer for shared recipe images. The `groceryMatchCount` metric in `src/routes/recipes.ts` is set to `pantryUsed.length` instead of the count of recipe ingredients not in the pantry, meaning `groceryPct` in the CSV is actually a duplicate of the pantry utilization rate rather than the grocery requirement rate. The discover feed `$queryRaw` lateral join on `PantryItem.ingredient` has no covering index, which will degrade as the pantry table grows.

**pluralStem duplication** — `routes/recipes.ts` and `routes/cookRecords.ts` both implement their own `pluralStem` function. The recipes.ts version is a simple 3-rule version; cookRecords.ts adds a full IRREGULAR dictionary and an `ee$` invariant guard (so "cheese" doesn't strip to "chees"). These are different enough that a recipe generated by one path and cooked via the other could produce different pantry-match results.

**`storeReport.ts` references deleted paths** — The script reads/writes `path.join(process.cwd(), "-ARCHIVE", "-WOULD", "usage-issue-v1.md")` and `usage-asset-v1.md`. These paths (`-ARCHIVE/-WOULD/`) do not exist in the current repo tree — the script would crash on `fs.readFileSync` if run. Either the archive was deleted or these paths were never migrated when the `could/` structure was adopted.

**No runtime body validation** — All routes cast `req.body as SomeType` via TypeScript. There is no runtime schema enforcement (Zod, joi, etc.). A malformed JSON body (e.g., `ingredients` sent as a string) either hits the array-check guard or is silently coerced. The guards are present in `/recipes/generate` but not consistently across all routes (e.g., `/records/start` only checks `recipeId`).

**`digest.ts` cross-account path** — `src/digest.ts` reads `/Users/jayagent/.openclaw/logs/infra_health.log` from a different OS account. If the jayagent account changes permissions or the file moves, `digest.ts` silently returns "infra_health.log unreadable" — acceptable degradation but worth noting.

**Dual route mounting** — `index.ts` mounts every route twice: once under `/1-1-1/...` (new) and once under the bare path (legacy). This doubles the Express route table and means any middleware bug could be triggered by either prefix. The legacy prefix removal is blocked on a forced mobile app update.
