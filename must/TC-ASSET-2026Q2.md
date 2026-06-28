MUST ASSET LOG
prompt: T&C coverage status, consent mechanisms implemented, agreement checkpoint flows
path: must/TC-ASSET-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:TC 2026-06-29 06:25 ▸ Auth system supports three identity providers; email verification implemented; no consent checkpoint yet

Three signup/login paths implemented: Google OAuth (`passport-google-oauth20`), Apple Sign-In (`appleId` String field in schema), and local bcrypt password flow (`bcryptjs`). Email verification token system present (`EmailVerificationToken` model with `expiresAt`). `profileVisibility` JSON field gives users granular public/private control over profile fields (`memberSince`, `sharedRecipeCount`, `preferences`, `continentPreferences`, `recipeStyle`). No T&C version tracking or consent checkpoint is currently implemented — this is the primary compliance gap for this category.
