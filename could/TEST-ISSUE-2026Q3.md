ISSUE LOG - TEST
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:test {YYYY-MM-DD HH:MM} → {CONTENT}

CUSTOM PROMPT:
Missing test coverage, untested edge cases, flaky tests, gaps in integration and e2e tests

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:test 2026-07-04 07:06 → CRUD happy paths covered but auth flows, AI generation, discover SQL, and share endpoints are untested; auth suite sits near the rate-limit cliff

**Untested surface (highest value first)**
- `POST /recipes/generate` — the core product path: rate-limit middleware (role tiers, Lua INCR), Claude→Ollama fallback, pantry-match derivation, metric writes. Zero tests; a regression here ships blind.
- Auth flows beyond register/login: `/auth/apple` (JWKS verify), Google callback, `forgot-password`/`reset-password`/`reset-password-form` (token expiry, single-use), `verify-email`, `resend-verification`. Token-expiry edge cases are one `Date` comparison away from a security bug.
- `GET /recipes/discover` — the largest raw-SQL query in the codebase (CTE + LATERAL join + visibility masking); schema renames won't be caught by the type checker.
- Share lifecycle: `POST/DELETE /:id/share`, `GET /public/:token`, og-image serving.
- `users.ts`: PATCH `/me` (password change, email conflict), `/me/privacy`, `DELETE /me` (manual FK-order deletes), public `/users/:id/profile` visibility masking.
- Also untested: `records/:id/abandon`, note PATCHes, reviews, `storeMetrics`, `chat` route, `runInsightAnalysis` analyzer logic, `extractFoodEmoji`/`pluralStem` (pure functions, cheapest wins available).

**Flakiness risks**
- `auth.test.ts` sends ~7 register/login POSTs against `authLimiter` (10 per 15min, in-process). Two more auth tests will start intermittently returning 429 — the failure will look unrelated to the change that triggers it.
- Suite requires live Postgres **and** Redis (`REDIS_URL` pinned); with Redis absent, rate-limit code fails open so tests pass, but `insights` cooldown paths would behave differently — environment-dependent behavior.

**No CI** — no `.github/workflows` in the tree; `npm test` runs only when someone remembers. No coverage reporting or threshold exists.
