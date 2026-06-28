MUST ASSET LOG
prompt: Privacy policy coverage, PII handling, data retention implementation, deletion endpoints
path: must/PRIVACY-ASSET-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:PRIVACY 2026-06-29 06:25 ▸ Visibility controls, cascade deletes, and token expiry implemented; demographic PII and deletion gaps remain open

`profileVisibility` Json field allows per-field public/private toggle. `PantryItem`, `SavedList`, `RecipeReview`, `CookRecord`, and `UserFlowView` all carry `onDelete: Cascade` against the User relation. `PasswordResetToken` and `EmailVerificationToken` both carry `expiresAt` for automatic expiry. Dietary preferences are user-controlled and replaceable via `PATCH /users/me/preferences`. `/users/me` response in `src/routes/users.ts` does not expose `passwordHash`, `googleId`, or `appleId`. Open gaps: no account deletion endpoint, no retention policy for `ageRange`/`gender`, and no third-party data disclosure visible in codebase.
