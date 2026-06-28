MUST ISSUE LOG
prompt: PII fields without encryption or retention policy, missing deletion paths, undisclosed third-party data sharing
path: must/PRIVACY-ISSUE-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ISSUE:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ISSUE:PRIVACY 2026-06-29 06:25 ▸ Demographic PII retained indefinitely; no account deletion endpoint; undisclosed third-party data flows

Three findings: (1) Migration `20260531000001_add_user_age_gender` adds `ageRange` (String) and `gender` (String) to the User model. Both are returned via `GET /users/me` (`src/routes/users.ts`) and stored with no stated retention limit or deletion mechanism. (2) No account deletion endpoint found in `src/routes/users.ts` or any other reviewed route — users cannot exercise right-to-erasure under GDPR/Privacy Act. (3) Undisclosed third-party data flows: Google OAuth shares identity with `googleapis`, Nodemailer transmits email addresses to SMTP provider, `@slack/bolt` sends operational data to Slack, and Claude/OpenAI/Ollama receive user recipe content including dietary preferences and pantry items — none of these are declared in any backend disclosure visible in the codebase.
