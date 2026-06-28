SHOULD ASSET LOG
prompt: review and update GENERAL ASSET decisions for 2026Q2
path: should/ASSET-2026Q2.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:API_VERSIONING 2026-06-28 13:12 → /1-1-1/ prefix introduced; v1-1-0 legacy routes maintained for backward compat

`src/index.ts` mounts all routes under `/1-1-1/` (auth, api/*, system/*) and mirrors them at root for old builds. `/app-config` returns `minVersion` (default `"1.0.6"`) for client-enforced upgrade prompts. Intended deprecation path is raising `minVersion` until old builds phase out, then removing legacy mounts.

## ASSET:AI_PROVIDER 2026-06-28 13:12 → Three-way AI provider abstraction: Ollama (default), OpenAI, Claude

`src/services/ai/provider.ts` defines `AIProvider` interface; implementations in `ollama.ts`, `openai.ts`, `claude.ts`. Default is Ollama (`qwen2.5:7b` at `http://127.0.0.1:11434`) running under the `jayagent` account on the same Mac mini. Provider selected via `AI_PROVIDER` env var. Ollama serialises requests via `this.queue = this.queue.then(...)` to avoid concurrent local model saturation. Prompt version tracked per-provider (e.g. `PROMPT_VERSION = "ollama-v5"`).

## ASSET:MIGRATIONS 2026-06-28 13:12 → 20 ordered Prisma migrations from 2026-03-30 to 2026-06-14

Migration sequence: init → default_servings → email_verification + password_reset → pantry → is_premium → recipe_style → emoji → provider/style_prefs → meal_type → pantry_used → cook_time → apple_id → remove_favourite_table → flow_system → is_admin → flow_admin_only → recipe_match_data (added then removed in successive migrations) → saved_lists → continent → continent_prefs → updatedAt + drop_flowstep → cook_record → user_age_gender → insights_drop_unique_add_history. `FlowStep` table and `FlowStepType` enum fully dropped in `20260530000000`.

## ASSET:COOK_RECORD 2026-06-28 13:12 → CookRecord model tracks full cooking sessions with ingredient/pantry/grocery split

`prisma/schema.prisma` `CookRecord`: status enum (STARTED/COMPLETED/ABANDONED), startedAt/completedAt/updatedAt, `ingredientCount`/`pantryCount`/`groceryCount` int fields plus JSON blobs `ingredients`/`pantryItems`/`groceryItems`. Route at `/1-1-1/api/records`. Enables session-level analytics on pantry utilisation and cook completion rates.

## ASSET:AUTH_STACK 2026-06-28 13:12 → JWT + Google OAuth + Apple ID + local auth + email verification + password reset

`src/middleware/auth.ts` validates Bearer JWT (`jsonwebtoken`). `src/routes/auth.ts` handles local register/login (bcryptjs), Google OAuth (passport-google-oauth20), Apple ID (`appleId` on User), email verification (`EmailVerificationToken`), and password reset (`PasswordResetToken`). Both token models have `expiresAt` field; lookup is by unique `token` column (no secondary index on userId).
