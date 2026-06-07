ISSUE LOG - MIGRATE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:migrate {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->
## ISSUE:migrate 2026-06-07 10:00 → Schema far ahead of README docs; appleId, role enum, ogImage, shareToken, and 8 undocumented models added

Prisma schema has grown significantly beyond what README describes. The following are present in schema but undocumented:

**Undocumented models:** `RecipeReview`, `SavedList`, `SavedListItem`, `PantryItem`, `Flow`, `FlowStep`, `UserFlowView`, `PasswordResetToken`, `EmailVerificationToken`

**Undocumented User fields:** `appleId` (Apple Sign-In), `role` (UserRole enum: free/premium/admin), `defaultServings`, `recipeStyle`, `continentPreferences`, `profileVisibility` (JSON), `emailVerified`

**Undocumented Recipe fields:** `shareToken` (unique, OG sharing), `ogImage` (Bytes, canvas-generated), `videoId` (YouTube), `continent`, `pantryUsed`, `provider`, `recipeStyle`, `emoji`, `mealType`, `cookTime`

**Risk:** No migration history visible in repo — only `schema.prisma`. Anyone running `prisma migrate deploy` in a fresh environment has no audit trail of how schema evolved. `profileVisibility` stored as raw JSON with no type enforcement; `ogImage` as Bytes will grow large in PostgreSQL over time.

**Action needed:** Run `prisma migrate status` to verify migration history exists on the Mac mini. Document all schema additions in README. Consider archiving `ogImage` blobs to object storage rather than DB columns.
