ISSUE LOG
INSTRUCTION FOR AI MODEL:

ALWAYS ADD NEW ISSUE ENTRIES AT THE TOP, DIRECTLY BELOW THIS HEADER.

NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES.

REQUIRED FORMAT FOR EACH ISSUE ENTRY:

## ISSUE:{NAME OF ENVIRONMENT} {YYYY-MM-DD HH:MM} → {CONTENT}

####### <!-- ANCHOR MARKER - ADD ALL NEW ISSUE ENTRIES DIRECTLY BELOW THIS LINE, NEVER DELETE OR EDIT PREVIOUS ISSUE ENTRIES-->## ISSUE:usage 2026-07-04 07:06 → Zero-result discover queries invisible, save-conversion lives only in console logs, /stats floor inflates early numbers

**Discover funnel drops its most important signal — `src/routes/recipes.ts`**
`appendDiscoverMetric` is called only `if (scored.length > 0)`. A user opening Discover and finding nothing — the strongest churn/content-gap signal — writes no row. The metric structurally cannot show how often discovery fails.

**Generate→save conversion isn't in any CSV** — Generation writes a rich RECIPE-METRIC row, but saves only emit `console.log("[recipe:saved] ...")` to pm2 logs, which rotate. The core product funnel (generated → hearted) can't be computed from durable data; the duplicate-save detection similarly only `console.warn`s.

**`/stats` floor of 10 — `src/index.ts`**
`Math.max(10, Math.round(n / 10) * 10)` means the public site claims ≥10 recipes/users even at zero. Fine as marketing, but if this endpoint feeds any internal reporting it silently overstates early traction.

**Auth metric silently drops rows** — `appendAuthMetric` returns early when the resolved IP is empty or loopback. Behind the Cloudflare tunnel this depends entirely on `trust proxy` working; if a config change breaks `req.ip` derivation, auth metrics go to zero with no error anywhere.

**Durability** — RECIPE, DISCOVER, and DIGEST CSVs exist only on the Mac mini's disk (only AUTH is pushed to GitHub); the usage history that these quarterly reviews depend on has no offsite copy.
