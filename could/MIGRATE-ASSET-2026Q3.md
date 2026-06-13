ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} -> {CONTENT}


CUSTOM PROMPT:
Migration tooling, seed scripts, rollback coverage

PATHS:
prisma/
####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:migrate 2026-06-08 10:00 â†’ Schema stable at 13 models, 4 enums; pantry cap 50; cascade coverage unchanged

Schema unchanged from end-of-Q2 state (branch 1-1-1). The bug-fix round required no Prisma migrations.

**Current schema summary:**

| Model | Notes |
|---|---|
| User | Core â€” 18 fields, roles: free/premium/admin |
| Recipe | ogImage Bytes, shareToken, ogImage, videoId |
| RecipeReview | @@unique(userId+recipeId) |
| SavedList / SavedListItem | Cascade on list delete |
| DietaryPreference | Manual delete in DELETE /users/me |
| PantryItem | @@unique(userId+ingredient), cascade from User; cap now 50 |
| Flow / FlowStep / UserFlowView | Onboarding system; cascade from User |
| UserInsight | @@unique(userId+category), cascade from User; Json data field |
| CookRecord | Cascade from User + Recipe; Json ingredient arrays; CookStatus enum |
| PasswordResetToken / EmailVerificationToken | Manual delete in route; no cascade |

**Enums:** `UserRole` (free/premium/admin) Â· `FlowTrigger` (first_login/manual) Â· `CookStatus` (STARTED/COMPLETED/ABANDONED)

**Cascade coverage:** User â†’ PantryItem, SavedList, UserFlowView, UserInsight, CookRecord: onDelete Cascade âœ“. Manual-delete pattern for DietaryPreference and auth tokens is documented in DELETE /users/me.