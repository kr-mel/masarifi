---
name: masarifi
description: Use when working on the مصاريفي expense-tracker PWA in this repo (editing decoded_app.js / مصاريفي.html / service-worker.js / manifest / privacy, building, deploying, or verifying). Enforces a token-efficient, do-the-work workflow.
---

# Working on مصاريفي — efficient workflow

Arabic (RTL)+EN expense-tracker PWA. Offline, localStorage `mxp_v3`, no backend. GitHub Pages → Android TWA. Edit `decoded_app.js` only; `مصاريفي.html` is the generated base64 bundle.

## Token discipline (the point of this skill)
1. **Never read whole files.** `decoded_app.js` ≈361KB, `مصاريفي.html` ≈861KB. Grep an anchor → Read with offset/limit (±15 lines). Never cat the `var _all=` base64.
2. **Deploy with the script:** `python build.py "msg"` (re-encode → bump SW cache → verify round-trip → commit+push). Never write inline encode python.
3. **Verify with a tiny text JS probe**, not screenshots — screenshots are the biggest token cost. Example: `mcp__Claude_in_Chrome__javascript_tool` returning `{mounted, n}`. Screenshot only when the user needs a visual judgment.
4. **Batch many edits per deploy** (Pages publishes in ~60–90s anyway). Wait with one background `sleep 80`; don't poll.
5. **Don't spawn agents that read the whole file** unless the user explicitly asks for a deep audit.
6. **Spend tokens on the work, not prose.** Do over explain. Short replies; no status reports / scorecards / plan recaps unless explicitly asked.

## Build / verify loop
1. Grep anchor → targeted Read → Edit (batch related fixes).
2. `python build.py "msg"`.
3. `sleep 80` (background) → unregister SW + clear caches in the page → reload `?v=N` → JS-probe `{mounted, n}` + console errors.

## Code map (grep these — lines shift)
`function App()` · `const THEMES` · `STRINGS` (AR then EN) · `function applyZoom` (`wide`,`tscale`,`density`,`dims`) · `localStorage.getItem('mxp_v3')` / `setItem('mxp_v3'` · `const totalD =`/`const dayN =` (month-aware) · `data-tour="fab"` / `const add = useCallback` · `updateTotalBudget` · `signInWithGoogle`/`GOOGLE_CLIENT_ID` · `exportBackup`/`importBackup` · `tab === "stats"|"budget"|"more"`.

## Conventions
Money in cents (int) via `fmt`/`fmtC`; `tabular-nums`. ids: `e${idRef}`/`i${incIdRef}` (restored on load). Bilingual: both `ar`+`en` keys or `lang === 'ar' ? … : …`. Touch ≥44px; functional text ≥11px; secondary text ≥`a6` alpha for WCAG AA.

See `CLAUDE.md` (same rules) and the project deploy-traps memory.
