ASSET LOG - MIGRATE
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:migrate {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->
## ASSET:migrate 2026-06-07 16:30 → Schema now 13 models, 4 enums; CookRecord + UserInsight added in branch 1-1-1; cascade deletes mostly correct

**Current schema summary (branch 1-1-1):**

| Model | New in 1-1-1? | Notes |
|---|---|---|
| User | no | Core model, 18 fields |
| Recipe | no | ogImage Bytes column present |
| RecipeReview | no | @@unique(userId+recipeId) |
| SavedList / SavedListItem | no | Cascade on list delete |
| DietaryPreference | no | No cascade from User (manual delete) |
| PantryItem | no | @@unique(userId+ingredient), cascade from User |
| Flow / UserFlowView | no | Onboarding flows system |
| UserInsight | **yes** | @@unique(userId+category), cascade from User |
| CookRecord | **yes** | Cascade from User and Recipe; JSON fields for ingredient lists |
| PasswordResetToken / EmailVerificationToken | no | Manual delete in users route |

**Enums:** `UserRole` (free/premium/admin) · `FlowTrigger` (first_login/manual) · `CookStatus` (STARTED/COMPLETED/ABANDONED)

**Prisma migrations folder:** `/tmp/toifood-source/prisma/migrations/` exists, migrations tracked.

**Cascade coverage:**
- User → PantryItem, SavedList, UserFlowView, UserInsight, CookRecord: onDelete Cascade ✓
- User → DietaryPreference, PasswordResetToken, EmailVerificationToken: no cascade (manual delete in route) — documented in DELETE /users/me
- Recipe → SavedListItem, RecipeReview, CookRecord: onDelete Cascade ✓
## ASSET:migrate 2026-06-07 10:00 → Prisma schema: 12 models, 3 enums, PostgreSQL on Mac mini M4

Current authoritative schema (`prisma/schema.prisma`):

**Enums:** `UserRole` (free/premium/admin) · `FlowTrigger` (first_login/manual) · `FlowStepType` (preferences/tip)

**Models:**
| Model | Key fields |
|---|---|
| User | id, email, name, googleId, appleId, passwordHash, role, defaultServings, recipeStyle, continentPreferences[], profileVisibility (JSON), emailVerified |
| Recipe | id, userId, title, description, ingredients[], steps[], servings, dietaryTags[], emoji, provider, recipeStyle, mealType, pantryUsed[], cookTime, continent, shareToken (unique), ogImage (Bytes), videoId |
| RecipeReview | id, userId, recipeId, stars — unique(userId+recipeId) |
| SavedList | id, userId, name |
| SavedListItem | listId+recipeId composite PK |
| DietaryPreference | id, userId, filter |
| PantryItem | id, userId, ingredient — unique(userId+ingredient) |
| Flow | id, title, trigger, priority, isActive, adminOnly |
| FlowStep | id, flowId, order, type, content (JSON) |
| UserFlowView | id, userId, flowId, completedAt, skippedSteps[], responses (JSON) — unique(userId+flowId) |
| PasswordResetToken | id, token (unique), userId, expiresAt |
| EmailVerificationToken | id, token (unique), userId, expiresAt |

**Deploy command:** `npx prisma migrate deploy` (Mac mini, jayreck account)
**Generate client:** `npx prisma generate`
