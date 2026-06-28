MUST ISSUE LOG
prompt: Pricing inconsistencies, missing currency validation, discount calculation errors, billing edge cases, unguarded price mutation paths
path: must/PRICE-ISSUE-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:PRICE 2026-06-29 06:25 ▸ Premium role has no verified payment trail — no receipt validation or subscription lifecycle management

`UserRole.premium` is a Postgres enum value with no in-app purchase receipt validation path. `src/services/appstore.ts` calls App Store Connect analytics APIs only (installs, sessions, activeDevices, crashes via `GET /apps/:id/metrics/:metric`) — no StoreKit 2 transaction verification or `POST /verifyReceipt` call exists. `src/services/playstore.ts` calls Play Developer Reporting for crash/ANR rates only — no `purchases.subscriptions.get` validation. No webhook handler exists for App Store Server Notifications or Play Store Real-Time Developer Notifications. The only way to elevate a user to `premium` is direct DB manipulation or an undiscovered admin route — there is no validated payment-to-role upgrade path in the reviewed codebase.
