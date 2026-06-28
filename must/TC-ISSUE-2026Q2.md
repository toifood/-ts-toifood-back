MUST ISSUE LOG
prompt: Missing or ambiguous consent flows, unenforceable terms implied by API surface, missing user agreement checkpoints
path: must/TC-ISSUE-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:TC 2026-06-29 06:25 ▸ No T&C acceptance recorded at registration — legally unenforceable against all users

The User model in `prisma/schema.prisma` has no `tosAcceptedAt`, `tosVersion`, or `consentGiven` field. All three signup paths (Google OAuth via `passport-google-oauth20`, Apple Sign-In via `appleId`, and local bcrypt email/password in `src/routes/auth.ts`) can complete without any terms acceptance checkpoint. Email verification (`EmailVerificationToken` with `expiresAt`) exists but is a separate flow from consent capture and does not substitute for T&C acceptance. Until a consent field and checkpoint are added, any T&C is legally unenforceable against registered users.
