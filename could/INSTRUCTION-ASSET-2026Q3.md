ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:instruction 2026-07-04 07:06 → Existing instruction assets: setup flow, env templates, provisioning script, stable error-code contract

- **README.md** — accurate for stack, architecture diagram (Cloudflare Tunnel → Mac mini dual-account layout), install/build/pm2 start steps, and Prisma setup commands (`prisma generate` / `migrate deploy`).
- **`.env.example` / `.env.test`** — environment templates checked in; vitest additionally pins `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL` in `vitest.config.ts` so tests are runnable with zero local config beyond Postgres+Redis.
- **`scripts/macmini-setup.sh`** — versioned host provisioning script for the production Mac mini.
- **npm scripts** — `dev` (nodemon + ts-node + tsconfig-paths), `build`, `start`, `test`, `test:watch`; `require.main === module` guard in `index.ts` documents-by-code that the app is importable for testing.
- **Error-code contract** — every error response carries a stable `code` (`MISSING_FIELDS`, `EMAIL_EXISTS`, `RECIPE_NOT_FOUND`, `LISTS_LIMIT_EXCEEDED`, …), an implicit machine-readable API instruction set the frontend already relies on; user-facing copy is consistently friendly-toned.
- **In-code operational docs** — comments explain non-obvious decisions (deep-link redirect rationale in Google callback, Lua rate-limit race note, Apple JWKS cache TTL justification, legacy mount phase-out note).
