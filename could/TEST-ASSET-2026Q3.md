ASSET LOG - TEST
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:test {YYYY-MM-DD HH:MM} → {CONTENT}

CUSTOM PROMPT:
Existing test infrastructure, coverage breadth, CI test setup, test utilities

PATHS:

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:test 2026-07-04 07:06 → Test infrastructure built from zero this quarter: vitest 4 + supertest, per-test DB reset, mock conventions, 7 suites

**Runner & config** — vitest 4 with `globals`, node environment, `testTimeout` 15s / `hookTimeout` 30s, and `fileParallelism: false` so suites share the test database safely. Test env (`DATABASE_URL` → `toifood_test`, `JWT_SECRET`, `REDIS_URL`) pinned in `vitest.config.ts`; `shared` alias resolves the cross-repo types. Scripts: `npm test` (run) and `test:watch`.

**DB isolation — `src/__tests__/helpers/db.ts`** — registered as a global setupFile: `beforeEach` truncates all 10 tables in one `$transaction` in FK-safe order; `afterAll` disconnects Prisma. Every test starts from a clean database.

**Auth helper — `src/__tests__/helpers/auth.ts`** — `createTestUser()` creates a unique verified user directly via Prisma (bypassing the rate-limited register route) and returns `{ user, token, authHeader }` — the pattern that keeps non-auth suites clear of `authLimiter`.

**Mock conventions** — external effects stubbed consistently at module level: `vi.mock` for `lib/chat` (alerts), `services/youtube` (video lookup → null), `services/ai/insights` (fire-and-forget analysis). App importable without listening thanks to the `require.main === module` guard in `index.ts`, so supertest drives the real Express stack including middleware.

**Coverage breadth** — 7 suites / ~30 cases against the `/1-1-6/` prefix: auth (register/login/middleware 401s), recipes (save, validation, videoId passthrough, list assignment, per-user isolation, cross-user delete 404), cookRecords (start/complete, pantry-vs-grocery split, ownership), insights (per-category latest-row semantics, user isolation), lists (CRUD, 5-list cap, membership), pantry (CRUD, dedupe 409, trim, clear-all), users (profile shape, preference validation, filter limits, recipeStyle). Ownership/isolation assertions appear in every resource suite — the authorization regression net is already in place.
