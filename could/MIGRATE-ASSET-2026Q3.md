ASSET LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ASSET ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES.

REQUIRED FORMAT FOR EACH ASSET ENTRY:

## ASSET:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ASSET ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ASSET ENTRIES-->## ASSET:migrate 2026-07-04 07:06 → 27-migration history Mar–Jul 2026: clean feature lineage, locked provider, deploy-ready

**Inventory** — 27 migrations from `20260330_init` to `20260703_remove_flows_model`, `migration_lock.toml` pinned to postgresql. Deployment path documented and standard: `npx prisma migrate deploy`.

**Feature lineage readable from history**
- Auth hardening: email verification + password reset (0401), Apple ID (0413).
- Recipe enrichment arc: style → emoji → provider/style prefs → mealType → pantryUsed → cookTime (int fix in a follow-up) → continent → share/OG (via schema fields).
- Product pivots cleanly recorded: Favourite table removed (0414) in favour of SavedLists (0417); flow system added (0415) and fully retired (0530 + 0703); insight status dropped when insights became append-history (0614 dropped unique, 0702 removed status).
- User model growth: default servings, isPremium→role enum with admin (0415), age/gender (0531), continent preferences (0505).

**Schema strengths** — `UserRole` and `CookStatus` as proper Postgres enums; composite PK on `SavedListItem` (`@@id([listId, recipeId])`); unique constraints where they matter (`userId+ingredient`, `userId+recipeId` reviews, `shareToken`, token tables); `@@index([userId, category])` on UserInsight matching the per-category query pattern in `routes/insights.ts`; newer models consistently use `onDelete: Cascade`.
