MUST ISSUE LOG
prompt: review and update ROADMAP ISSUE compliance and business requirements for 2026Q4
path: must/ROADMAP-ISSUE-2026Q4.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ISSUE:roadmap 2026-10-05 09:50 ▸ 2026Q4 opening check: no commits on `main` since 2026-09-24, and all 8 ROADMAP gaps from the 2026-09-28 log are still open

This is the first ROADMAP log for 2026Q4. The newest commit on `main` is still `3c7572d` (2026-09-24), which the 2026-09-28 log already covered. No migration has landed since `20260828030000_preference_type_value_index`. Every open item was checked again against the current `main`.

(1) **Carried, still open: an emailed PIN works as a sign-in for OAuth-only accounts.** `requestPin` and `resendVerification` (`src/domains/auth/register.ts`) still don't check `passwordHash`. `verifyPin` still calls `signToken(user.id)` and records `metric: { event: "login", method: "pin" }`. That gives any Google-only or Apple-only account a third sign-in method, an emailed 6-digit code, which anyone can start from an unauthenticated endpoint with only the email address. There is still no authenticated "verify my email" endpoint, and no test covers what `verify-pin` returns for an OAuth account.

(2) **Carried, still open: the ERD will fall out of date.** `docs/ERD.md` is committed, but nothing regenerates it automatically. The repo has no `.github/` workflows, and no migration hook runs `npm run erd` (`scripts/generate-erd.ts`).

(3) **Carried, still open: there is still no way to grant a paid tier.** `package.json` still has no Stripe, RevenueCat, IAP or receipt-verification dependency, and there is no billing or webhook route. `src/routes/admin.ts` has two `PATCH` routes (lines 54 and 76), and both moderate reports. `role`, `premiumSince` and `premiumUntil` are only selected (lines 18-19) and never written, so a user's tier can only be changed by editing the database directly.

(4) **Carried, still open.** `matchUsers` (`src/domains/user/register.ts:537`) still only returns candidates whose role is `super_pro` or `admin` (line 552). Because of (3), no real user can reach those roles, so `GET /users/view/self/matches` returns nothing unless someone is promoted by hand.

(5) **Carried, still open.** `Follow.mutedAt` and `Follow.blockedAt` exist only in the schema. `src/domains/follow/register.ts` only reads `blockedAt` (lines 96, 290, 313, 368). Nothing ever writes either field, so users still can't mute or block anyone.

(6) **Carried, still open.** `src/modules/playstore/register.ts:54-55` still hardcodes `installs30d` and `activeDevices30d` to `null`.

(7) **Carried, still open: the route version doesn't match `minVersion`.** Routes are still mounted under `/1-1-6/*` (`src/index.ts:77-98`), while the `/app-config` `minVersion` fallback is `"1.1.9"` (`src/index.ts:153`).

(8) **Carried, still open.** `src/routes/insights.ts` still has only `GET /`, `GET /view/system` and `POST /refresh`. There is still no way to accept or dismiss a single suggestion.

Nothing has moved since the end of Q3. Items (1) and (3) are the most important at the start of the quarter: (1) is an authentication path that has already shipped, and (3) blocks both monetization and the matching feature.
