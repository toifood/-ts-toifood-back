ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:migrate 2026-07-04 07:06 → Destructive drops with no archival step, hand-stamped migration timestamps, inconsistent cascade rules

**Destructive migrations without archival** — `20260414000000_remove_favourite_table`, `20260417014518_remove_recipe_match_columns`, `20260530000000_add_updated_at_drop_flowstep`, `20260702000000_remove_insight_status`, `20260703000000_remove_flows_model` all drop tables/columns directly. There is no evidence of a data-export step preceding them; on a single Mac mini with no documented DB backup, each of these was an irreversible data deletion.

**Hand-written timestamps** — at least six migrations use fabricated `000000`-style times (`20260406000000`, `20260413000000`, `20260414000000`, `20260505000000`, `20260530000000`–`20260703000000`). Hand-stamped names risk ordering collisions with generated ones and suggest migrations edited outside `prisma migrate dev`; drift between `schema.prisma` and applied SQL becomes hard to detect.

**Inconsistent `onDelete` rules force manual delete choreography — `prisma/schema.prisma` + `src/routes/users.ts`**
`Recipe.user`, `DietaryPreference.user`, `PasswordResetToken.user`, `EmailVerificationToken.user` have no cascade, while PantryItem/SavedList/CookRecord/UserInsight/RecipeReview do. `DELETE /users/me` therefore hand-deletes in FK order across 5 statements, not in a transaction — a crash mid-sequence leaves a half-deleted account (e.g. user row gone attempt fails after recipes already purged). Adding cascade uniformly would collapse this to one `user.delete`.

**No seed or migration test** — the vitest suite assumes `toifood_test` already has the current schema; nothing in CI or scripts runs `migrate deploy` against the test DB, so a merged migration can silently break every test environment.
