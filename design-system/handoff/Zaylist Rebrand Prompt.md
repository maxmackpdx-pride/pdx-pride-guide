# Claude Code task: rebrand "PDX Pride Guide" to "Zaylist"

## Mission
Rebrand this repository from **PDX Pride Guide / Pride Guide** to its new official name **Zaylist**. Remove every existing logo, watermark, brand mark, favicon, app icon, and visual-identity asset tied to the old brand, and replace all textual references. Zaylist is the new source of truth; treat every prior brand reference as obsolete.

Work surgically: **only change what is actually a brand reference.** Every edit you make should be a targeted diff. Do not reformat, refactor, or touch unrelated code, logic, styling, or layout. If a file has no brand reference, leave it untouched.

## Hard constraints
- **Local only. Do not publish.** No `git push`, no pull requests, no deploys, no `npm publish`, no release tags, no CI triggers. Local commits on a local branch only.
- Start on a fresh branch: `git checkout -b rebrand/zaylist`. Commit in small, reviewable chunks.
- Keep the build green. After changes, run the project's typecheck, lint, and build (e.g. `npm run build` / `tsc` / `eslint`) and fix anything your edits broke.
- Do not change public API shapes, env var names, database fields, or routes unless they literally contain the brand string AND changing them is safe across all references. When in doubt, list it for review instead of guessing.

## The new name
- Product name: **Zaylist**
- Wordmark: **ZAYLIST** (all caps in display/logo contexts), trademark **ZAYLIST™** where the old brand used a ™.
- Possessive/sentence case: "Zaylist" (e.g. "Welcome to Zaylist", "Return to Zaylist").

## 1. Text audit and replace (decisive)
Search the whole repo (code, JSX/TSX, CSS, JSON, MD, HTML, manifest, meta tags, comments, test fixtures, i18n strings, package name/description) and replace brand-name references:
- `PDX Pride Guide` -> `Zaylist`
- `Pride Guide` -> `Zaylist`
- `PDXPrideGuide` / `PdxPrideGuide` -> `Zaylist` (PascalCase identifiers, component names, types)
- `pdx-pride-guide` / `pdxprideguide` -> `zaylist` (kebab/lowercase: package name, slugs, css classes, test ids)
- `pdx_pride_guide` -> `zaylist` (snake_case)
- Any domain/handles like `pdxprideguide.com`, `@pdxprideguide` -> `zaylist.com` / `@zaylist` (use `zaylist.com` as placeholder; flag for confirmation)
- Page `<title>`, meta `og:title`/`og:site_name`/`description`, `manifest.json` `name`/`short_name`, `<html lang>` unaffected.

When you rename an identifier (component, type, class, variable, file), **update every reference and import** so the build stays green. Rename files whose names carry the brand (e.g. anything `*PrideGuide*`) and fix import paths.

Known specific spots to check (from the current tree):
- `shared/prideWeek.ts` -> rename to `shared/eventWeek.ts`; update all imports and the exported symbol names that carry "pride".
- Hub shells: "Return to Pride Guide" -> "Return to Zaylist" (`client/src/components/hub/HubShell.tsx`, `HubV2Shell.tsx`).
- Admin nav label "Pride Werk" -> "Gig Werk" (already the intent elsewhere); confirm.
- Boot/splash fallback copy in `client/index.html` ("Pride Guide is loading...").
- Token file headers that read "PDX Pride Guide" in `client/src/**/tokens/*.css` and `design-system/tokens/tokens.css`.

## 2. The word "Pride" used on its own (report, do not blanket-replace)
Some occurrences of "pride" are the old brand; others may be genuine community references (rainbow/pride flag color tokens like `--flag-*`, accessibility labels, historical copy). Do **not** blindly delete the word everywhere.
- Confidently replace it only where it is clearly the product brand ("Pride Guide", "the Guide", app titles).
- For every other standalone "pride" / "Pride Week" / "Pride flag" reference, produce a list (file + line + surrounding text + your recommended replacement) and leave the code as-is pending human review. Recommended default framing is event-focused ("events", "the scene") rather than a fixed pride week.

## 3. Visual identity: remove and replace
Remove all old brand imagery and replace with the Zaylist asset set:
- Logos, wordmarks, watermarks, lockups (old PDX Pride Guide marks) in `client/public/`, `client/src/assets/`, any `favicon*`, `apple-touch-icon*`, `og-image*`, `icon-*`, PWA `manifest` icons, splash screens.
- Replace with the Zaylist assets: dark Z app tile, light Z app tile, the ZAYLIST spectrum wordmark (transparent PNG), and an on-white wordmark. Generate favicon and PWA icon sizes from the Z tile. If the final asset files are not yet in the repo, wire the references to the expected paths and leave a clearly marked TODO list of the exact files to drop in (name, size, format).
- Delete orphaned old-brand image files once nothing references them (verify with a repo-wide search first).

## 4. Design source of truth (Zaylist)
Align brand-driven visual tokens to the Zaylist design system. The one substantive visual change beyond naming is the **hero wordmark gradient**:
- Old `--grad-rainbow` was a 5-stop sweep (cyan -> green -> yellow -> orange -> magenta).
- New Zaylist spectrum is the 9-stop full-hue tape sampled from the ZAYLIST wordmark, wrapping back to magenta:
  `linear-gradient(100deg, #FF19D6 0%, #FF196C 12%, #FF5319 24%, #FFD119 34%, #9CFF19 44%, #5BFF19 54%, #19F7FF 66%, #1956FF 76%, #E419FF 90%, #FF19D6 100%)`
  Do not reorder the stops; the wrap is what makes it read as a spectrum.
- Fonts (Barlow Condensed display + Inter body), the neon palette, surfaces, day colors, and flag-nod tokens are unchanged. Do not alter them.

## 5. Verification before you hand back
- Repo-wide search confirms zero remaining `pride guide` / `pdxprideguide` / `PDXPrideGuide` (case-insensitive) except items you deliberately left in the review list.
- Build, typecheck, and lint pass.
- App boots locally; the header, splash, hub back-link, page title, and favicon all read Zaylist.
- No network publish/deploy/push happened.

## Deliverables (write to the repo, do not push)
1. The rebrand commits on `rebrand/zaylist`.
2. `REBRAND_REPORT.md` at repo root listing: files changed, identifiers/files renamed, assets removed, asset TODOs (exact files to supply), and the "standalone pride reference" review list from step 2.
