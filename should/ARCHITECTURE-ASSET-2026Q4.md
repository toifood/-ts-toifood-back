SHOULD ASSET LOG
prompt: review and update ARCHITECTURE ASSET decisions for 2026Q4
path: should/ARCHITECTURE-ASSET-2026Q4.md
target: {repo}

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS THE SYSTEM EVOLVES.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->
## ASSET:ARCHITECTURE 2026-10-05 10:08 ▸ Q4 opening baseline: architecture frozen at `3c7572d` with 20 models, migrations ending at `20260828030000`, single Mac mini plus Cloudflare Tunnel, `/1-1-6` plus legacy routing, and a generated ERD

**Context.** This is the first entry in the 2026Q4 log. It records the state as checked today so later Q4 entries can describe changes from it. `toifood/ts-toifood-back` `main` is at `3c7572d` (2026-09-24), with no commits since. The Q3 entries are now one quarter old, so the facts below were checked again against `main` today.

**Schema.** `prisma/schema.prisma` has 20 models: `User`, `Follow`, `Review`, `ReviewCategoryRating`, `Recipe`, `RecipeReport`, `UserReport`, `Bookmark`, `RecipeReview`, `SavedList`, `SavedListField`, `SavedListItem`, `Property`, `Note`, `Draft`, `Notification`, `Preference`, `PantryItem`, `UserInsight`, `EmailPin`. `User` is the hub, with `Recipe` and `SavedList` as secondary parents. Lifecycle state uses boundary timestamps (`requestedAt`/`openedAt`/`updatedAt` style) on `Follow`, `Review`, `Note`, `Draft`, `SavedListField`, and `UserInsight`, not status enums. Personality data lives in `User` columns again (`20260828020000_revert_personality_to_user_columns`).

**Migrations.** There are 98 migration folders, from `20260330025042_init` to `20260828030000_preference_type_value_index`. Nothing new has landed in more than 5 weeks. Late-Q3 work moved free-text categories to enums: `enum_to_string_categories`, then `add_recipe_style_enum`, `add_recipe_provider_enum`, `recipestyle_to_preferencestyle`, and `property_type_own_enum`. It also added the `(type, value)` index on `Preference`. See the ISSUE log for the gap between the schema and the migrations.

**Deployment and runtime.**
- Hosting: a single Mac mini M4 with two macOS accounts. `jayreck` runs the API (`:3000`, PM2 process `toifood-back`) and PostgreSQL (`:5432`). `jayagent` runs Ollama (`qwen2.5:7b`, `:11434`), reached only on `127.0.0.1`.
- Ingress: a Cloudflare Tunnel to `toifood.co.nz`, with `trust proxy = 1` set in `src/index.ts`.
- Outbound networking: forced to IPv4 at startup (`src/index.ts:18-19`) to fix Gmail SMTP EHOSTUNREACH.
- Ops access: the `/chat` Google Chat bot (`!status`, `!logs`, `!metrics`) and `src/slack-bot.ts`.

**Code layout.**
- `src/domains/*` holds the entity and business-logic domains: recipe, user, follow, review, report, bookmark, list, note, draft, insight, pantry, ingredient, emailpin, agent, auth.
- `src/modules/*` holds cross-cutting modules: rate, language, role, generate, cookie, email, emailpin, push, seo, ogimg, analysis, preference, idp, appstore, playstore, highlight, color, content, section, type, api.
- Each module exposes a single `register.ts`, plus optional `constants.ts`/`utils.ts`. Routes in `src/routes/*.ts` stay thin.
- `src/index.ts` mounts every route twice: under `/1-1-6/{auth, api/*, system/*}` and on the legacy unprefixed paths, so older mobile builds keep working.

**Auth.** Sign-in methods are password (bcrypt, cost 12), Google and Apple IdP (`src/modules/idp`, cached Apple keys), and EmailPin (`request-pin`/`verify-pin`), which is now open to OAuth-only accounts. The pieces that guard against brute force and account discovery: `authLimiter`, `issuePin`'s resend throttle, `checkEmailPinRateLimit`, and endpoints that always return 200.

**Documentation that exists.** `docs/ERD.md` is generated from `Prisma.dmmf` by `scripts/generate-erd.ts` via `npm run erd`. It is a Mermaid diagram that lists key fields only (PK/FK/UK). `scripts/macmini-setup.sh` sets up the host (Node 22). `README.md` covers topology, with stale sections listed in the ISSUE log.

**Recovery state.** Code can be restored from git. The schema can be partly rebuilt from migrations, but three declared models are missing from them (see the ISSUE log). There is no documented database backup or restore, so data recovery currently depends on the single host surviving.
