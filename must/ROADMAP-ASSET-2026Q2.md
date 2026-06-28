MUST ASSET LOG
prompt: Feature completion status, implemented flows vs planned, current quarter delivery progress
path: must/ROADMAP-ASSET-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:ROADMAP 2026-06-29 06:25 ▸ Cook records, 5-category insights, flow system, multi-provider AI, and continent preferences fully shipped this quarter

Delivered in 2026Q2: cook record lifecycle (start/complete/abandon with pantry stem-matching) in `src/routes/cookRecords.ts`; 5-category AI insight system (dietary/cuisine/style/pantry/mealType) with auto-apply for accepted dietary insights in `src/routes/insights.ts`; flow system for `first_login` and `manual` triggers with admin controls in `src/routes/admin.ts` and `src/routes/flows.ts`; multi-provider AI routing (Claude/Ollama/OpenAI) with provider abstraction in `src/services/ai/`; continent preferences (`continentPreferences String[]`) added to User model; demographic fields (`ageRange`, `gender`) added (migration `20260531000001`); shared recipe public profile with per-field visibility at `GET /users/:id/profile`; Google Chat bot integration (`src/routes/chat.ts`) with `!status`, `!logs`, `!metrics` commands. Open roadmap items: Play Store BigQuery pipeline, metrics CSV write path, YouTube video association.
