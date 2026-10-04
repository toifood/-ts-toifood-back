MUST ASSET LOG
prompt: review and update ROADMAP ASSET compliance and business requirements for 2026Q4
path: must/ROADMAP-ASSET-2026Q4.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ASSET:roadmap 2026-10-05 09:50 ▸ 2026Q4 opening check: nothing new shipped since 2026-09-24, and everything from Q3 is still live on `main`

This is the first ROADMAP asset log for 2026Q4. No commits have reached `main` since `3c7572d` (2026-09-24), so nothing new has shipped. Everything recorded at the end of Q3 is still in place:

(1) **EmailPin delivery fix still holds.** The fix that makes EmailPin connect over IPv4 is still at the top of `src/index.ts` (`net.setDefaultAutoSelectFamily(false)` with `dns.setDefaultResultOrder("ipv4first")`). After a successful send, `sendPinEmail` still logs the SMTP `messageId` and response. Signup verification, forgot-password, email change and account deletion all depend on this.

(2) **Google/Apple EmailPin support is still live.** `requestPin` and `resendVerification` work for OAuth-only accounts (`src/domains/auth/register.ts`), so those accounts can prove they own their email. The paired ISSUE log tracks that this also lets them sign in with a PIN.

(3) **The ERD generator is still available.** `scripts/generate-erd.ts` (`npm run erd`) and the committed `docs/ERD.md` still match the schema, since no migration has landed after `20260828030000_preference_type_value_index`.

(4) **Earlier assets are still live:**
- `matchUsers` and `matchLists` matching by shared preferences (`src/domains/user/register.ts:537`)
- tier setup through `getTier(user)`
- admin user list plus report moderation (`src/routes/admin.ts`, 3 `GET` and 2 `PATCH` routes)
- App Store and Play Store connections, including Play Store crash and ANR rates
- the recipe provider and style enums
- the `Preference` model with 65 countries
- bookmarks
- public username and QR profiles
- the metrics and digest pipeline
- insight refresh (`POST /insights/refresh`)
- the full `/1-1-6/*` versioned API surface

Roadmap items that are still open are listed in the paired ISSUE log.
