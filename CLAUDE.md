# مصاريفي — project guide (read this, don't re-derive)

Arabic (RTL) + English personal **expense-tracker PWA**. Offline-first, localStorage
only (key `mxp_v3`), no backend. Deployed via GitHub Pages → becoming an Android TWA.
Live: https://kr-mel.github.io/masarifi/مصاريفي.html

## ⛽ TOKEN DISCIPLINE — follow strictly (this is why this file exists)
1. **NEVER read whole files.** `decoded_app.js` ≈361KB and `مصاريفي.html` ≈861KB. Reading either fully wastes ~100K+ tokens.
   - Find code with **Grep** (specific pattern) then **Read with offset/limit** (±15 lines). Never `Read` without limit on these.
   - Never print/cat the base64 (`var _all=`) or the full HTML head — the head's meta tags are tiny at the very top; the rest is the base64 blob (ignore it).
2. **Build & deploy with the script — never write inline python.** `python build.py "commit msg"` re-encodes `decoded_app.js`→ the `_all` bundle in the HTML, bumps the SW cache, verifies round-trip, and commits+pushes. (Omit the msg to build without git.)
3. **Verify with text, not screenshots.** Screenshots are the single biggest token cost. Use a tiny `mcp__Claude_in_Chrome__javascript_tool` probe returning a small object (e.g. `{mounted, zoom, fillPct, err}`). Only screenshot when the user needs a *visual* judgment.
4. **Batch many edits per deploy.** GitHub Pages takes ~60–90s to publish regardless, so group fixes and deploy once. Wait with ONE background `sleep 80`; don't poll.
5. **Don't spawn agents that read the whole file** unless the user explicitly asks for a deep audit — each agent re-reads the 361KB source.
6. Don't re-read a file you just edited; Edit fails loudly if it didn't apply.

## Build / deploy workflow
- **Edit only `decoded_app.js`** (the real source) + support files. `مصاريفي.html` is generated — never hand-edit the `_all` bundle.
- `python build.py "msg"` → re-encode + bump SW cache vN + commit + push.
- GitHub Pages publishes in ~60–90s. The SW is **network-first for the page**, so a normal refresh gets the new build (no cache-bust needed). To force on a stuck device: unregister SW + `caches.delete` all, then reload.

## File map
- `decoded_app.js` — the entire app: React runtime + one giant `App()` component (~75 useState), all `React.createElement` (no JSX), all inline px styles. **Gitignored** (build artifact source).
- `مصاريفي.html` — shipped bundle; `<head>` (meta/style) at top, then `var _all="<base64 of decoded_app.js>"`.
- `service-worker.js` — network-first page, cache-first assets; `CACHE_NAME = masarifi-vN`.
- `manifest.json`, `privacy.html`, `icons/`, `.well-known/assetlinks.json` (TWA — fingerprint still placeholder).

## Code map for `decoded_app.js` (grep these anchors — lines shift, anchors don't)
- App start: `function App()` · themes: `const THEMES` · strings: `STRINGS` (AR block then EN)
- Responsive/layout: `function applyZoom` (fills viewport; `wide` = innerWidth≥900 grid on home; `tscale`, `density`, `dims`)
- Persistence load: `localStorage.getItem('mxp_v3')` · save effect: `localStorage.setItem('mxp_v3'`
- Month-aware counters: `const totalD =` / `const dayN =` (near `viewMo`/`viewYr`)
- Add expense: `data-tour="fab"` onClick / `const add = useCallback` · sheet inputs near `value: desc`/`value: amt`
- Budget update: `updateTotalBudget` · health/insights: `healthScore`, `const insights = useMemo`
- Export: `exportCSV`/`exportJSON`/`exportPDF`/`exportText` · Google sign-in: `signInWithGoogle` / `GOOGLE_CLIENT_ID`
- Tabs render: `tab === "stats"` / `"budget"` / `"more"` ; home content grid: `tab === "home" && wide`

## Conventions
- Money stored in **cents** (integers). Format via `fmt`/`fmtC`. Numbers use `tabular-nums`.
- New ids: expenses `e${idRef}`, income `i${incIdRef}` (counters restored from saved data on load). Others use `Date.now()`.
- Bilingual: add BOTH `ar` and `en` keys in `STRINGS`, or inline `lang === 'ar' ? … : …`.
- Touch targets ≥44px; keep functional text ≥11px; verify WCAG AA contrast (avoid low-alpha fg over light bg).

## Known open items (from the full audit — fix on request, don't re-discover)
Recurring/goal **edit** missing; no JSON **import**; CSP absent; assetlinks SHA-256 is a placeholder
and GitHub *project* Pages can't serve `/.well-known/` at domain root (TWA chromeless launch blocked);
manifest `screenshots` empty + Play feature-graphic missing; Arabic Day pluralization ("يوم/أيام/يوماً");
category accent `borderRight` doesn't mirror in LTR; wide-screen design still debated.
