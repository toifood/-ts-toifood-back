ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:price 2026-07-04 07:06 → OG image bytes bloat Postgres, YouTube quota is the hidden ceiling, admin tier is effectively unmetered

**`Recipe.ogImage Bytes` stores a full PNG per saved recipe — `prisma/schema.prisma`**
Each 1200×630 PNG is ~100–300KB written into the row. The list endpoint correctly excludes it via `select`, but the table (and every backup/restore) grows linearly with saves; at scale this is the dominant DB storage cost on a machine with no external object store. Moving to disk/R2 with a path column would cut DB size by an order of magnitude.

**YouTube Data API is the tightest quota — `src/services/youtube.ts`**
Each `search.list` call costs 100 units against the default 10,000/day quota → hard ceiling of ~100 searches/day, shared by `/recipes/generate`, `/recipes` save (when client omits `videoId`), and the open `/recipes/youtube` endpoint. Failures return `null` silently, so quota exhaustion looks like "videos stopped working" with no alert.

**Admin role = 999 generations/day of Claude — `src/middleware/rateLimit.ts`**
Admin bypasses rate limiting entirely (`role === "admin" → next()`), so the 999 cap isn't even the bound; a leaked admin token means unbounded Anthropic spend. There's no monthly spend cap or alerting tied to the `usedProvider=claude` metric rows.

**Dead OpenAI path can still bill** — `OPENAI_API_KEY` is documented and `OpenAIProvider` uses gpt-4o (premium pricing), but the code path is unreachable. If the key is provisioned in `.env` it's a standing credential paying for nothing while widening leak surface.
