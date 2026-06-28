MUST ASSET LOG
prompt: Pricing model implementation, payment flows, subscription management, billing validation coverage
path: must/PRICE-ASSET-2026Q2.md
target: toifood/-ts-toifood-back

INSTRUCTION FOR AI MODEL:

YOU MAY READ AND UPDATE EXISTING ENTRIES AS REQUIREMENTS EVOLVE.
ADD NEW ENTRIES AT THE TOP FOR NEW TOPICS; UPDATE IN PLACE FOR EXISTING ONES.

FORMAT: ## ASSET:{NAME} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD OR UPDATE ENTRIES DIRECTLY BELOW THIS LINE -->## ASSET:PRICE 2026-06-29 06:25 ▸ Role-based tier system implemented; App Store and Play Store metric integrations present; no payment validation yet

`UserRole` enum (free/premium/admin) defined in `prisma/schema.prisma`. `GET /users/me` returns `isPremium: user.role !== "free"` and `isAdmin: user.role === "admin"`. Rate limiter in `src/middleware/rateLimit.ts` enforces tier-differentiated recipe quotas (free: 3 ollama/2 claude per hour; premium: 10 ollama/5 claude per hour). App Store Connect integration (`src/services/appstore.ts`) fetches P30D install/session/activeDevices/crash metrics. Play Store integration (`src/services/playstore.ts`) fetches 7-day crash and ANR rates. Neither integration performs subscription receipt validation — payment verification is the primary open item for this category.
