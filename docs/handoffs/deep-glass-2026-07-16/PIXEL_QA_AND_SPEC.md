# Zaylist - Pixel-QA + Spec Answers

Grounded in `maxmackpdx-pride/pdx-pride-guide@master` (read directly, not from memory). Use with `Card-System.html` and `screenshots/`. QA rows are the SoT-vs-repo deltas I can confirm from source; the live-app pixel pass (the property-by-property checklist you drafted) still needs a human at the running app - this tells that human exactly what to look for.

## 1. Spec clarifications - RESOLVED from source
These were the four open questions. The repo settles three of them outright.

**Seam - one engine, not two.** There is a single seam system: `.pdx-rainbow-rule` / `.pdx-seam` and the card `::before` (`client/src/components/ds/tokens/base.css`). It is a **3px hard bar**, `linear-gradient(90deg, cyan, yellow, magenta, orange, cyan)` at `background-size:200% 100%`, animated `pdxSeamFlow 3.4s linear` + `pdxSeamGlow 3.4s ease-inout`, with a 10px blurred `::before` bloom (opacity .48) and a white `::after` glint (`pdxSeamGlint`). It rides the top of **every clickable card**: `.pdxBoard, .pdxRow, .board-listing-card, .event-board-card, .board-spotted-card, .spotted-card, .schedule-event-card, .card.fitem--glow, .featured-event-ad`, and PlaceCard's explicit `.pdxPlace__seam`. **There is no 2px `dirRefract`** - that name was a SoT invention. ACTION: the SoT's directory-map `dir-refract` 2px seam (Card-System §Map, the `left:8px;right:8px` bar) is the one place that diverges - treat maps as `.pdxMap__seam` and bring them to the shared 3px rule (or explicitly document maps as an inset 2px variant if that's intended). All other card seams = 3px `pdx-rainbow-rule`.

**Glass hover - 6px is the directory value, by design.** `.pdxPlace--clickable:hover{ transform:translateY(-6px) }` + `filter:brightness(1.08) saturate(1.08)` + `box-shadow:0 20px 44px -20px rgba(0,0,0,.85)` over `.16s`. The `--hover-lift:-2px` token governs legacy/dense elements. RECOMMENDATION: keep **6px for large standalone cards** (directory/place, big media well), **2–3px for dense grid rows** (events grid, feed rows) - the bigger the card, the bigger the lift. Don't blanket-unify; the split is intentional. If you do want one number, 4px reads well for both.

**Neutral / text-heavy cards - bloom strength.** Feed activity rows use the plain (non-`--glow`) treatment: **no seam, no bloom** - only `.fitem--glow` cards get the rainbow seam. For neutral glass rows keep the white/grey bloom faint: `--dir-gm` ~30–40 (vs 60 default on accent cards). White bloom at full strength on text rows greys out the type.

**Canonical Button.** `client/src/components/ds/Button.tsx` is the brutalist `btn-neon`: 2px accent outline, `background:rgba(0,0,0,.62)`, `border-radius:2px`, `box-shadow:4px 4px 0 <complement>`, hover fills accent + `translate(-1px,-1px)` + `6px 6px 0`, active `translate(3px,3px)` + `1px 1px 0`. Variants: `neon` (default), `solid`, `gradient`, `pill`, `ghost`. See the glass-button proposal in Card-System §16 for the replacement.

## 2. QA rows (SoT ↔ repo, source-confirmed)
| # | Surface | Verdict | Delta to check on the live app |
|---|---------|---------|--------------------------------|
| 01–02 | Event grid + modal | PASS structure | Confirm grid card lift is the dense value (2–3px), not 6px. Seam is 3px shared rule. |
| 03 | Directory cards | PASS | `pgDirCardIn .55s`, 6px hover, `--dir-gm` glow, 3px `.pdxPlace__seam`. SoT matches PlaceCard.tsx. |
| 04 | Board cards + overlay | PASS | Seam on all board variants; motifs were placeholders → now in §17. |
| 05–06 | Maps | FAIL (seam) | SoT uses 2px inset `dir-refract`; repo cards use 3px `pdx-rainbow-rule`. Decide: unify to 3px, or document `.pdxMap__seam` as the intended 2px inset variant. Vignette + pin bloom OK. |
| 07 | Floating inbox + FAB | PASS | Glass recipe on `#1A4DFF`. |
| 08 | Work / project rows | CHECK | Agent 7 note: About "Open for business" rows may still be off - screenshot lives on About, work was Hosting/Venue only. Verify About page. |
| 09 | Nav drawer / bar / pull | PASS | `pullHandle` new; drawer/bar on glass. |
| 10 | Islands tiles | CHECK | Agent still landing per your note - re-shoot when deployed. |
| 11–13 | Promoter / infra / support | PASS | Glass recipe. |
| 14–15 | Hub feed + ads | PARTIAL | Feed rows: neutral (no seam) vs `.fitem--glow` (seam) - confirm only glow cards get seam. FeaturedEventAd now on glass in §18. |

## 3. Assets delivered (in Card-System.html §16–§20)
1. **Glass button state sheet** (§16) - default / hover / active / disabled / outline / solid, three accents + rainbow-special. Proposed to replace brutal `btn-neon` as the default; keep gradient for special moments.
2. **Board backdrop motifs** (§17) - quote / gift / magnifier / dollar / binoculars, 1.5px line SVGs, accent-stroked, meant to sit at 4–12% opacity top-right of each board card.
3. **Featured-event-ad glass frame** (§18) - `.featured-event-ad` on the full glass recipe with 3px seam, "Featured · Ad" chip, poster slot, dual CTA.
4. **Schedule-card glass frame** (§19) - `sc-card` chrome, cyan kicker, 3px seam, magenta now-line timeline.
5. **Calm-mode stills** (§20) - normal (full bloom) vs `data-calm` (bloom off, seam frozen, grey tint, inset sheen retained). The sign-off pair for "does calm still read glass?".

## 4. Still needs a design/eng call (outside the asset set)
- **Global Button swap** - replacing `btn-neon` default with the §16 glass button is a DS change; gradient/pill/ghost variants stay.
- **Map seam** - the one real SoT↔repo conflict (see row 05–06). Pick 3px shared or 2px inset and document it.
- **Partner logos on `#050506` wells** - CockBlock / Mr. S render fine in SoT; swap to higher-res source art if available.
- **`design-system/` portable kit** - not yet synced from the new `glass.css`; regenerate from tokens.
- **Home map embed** - may lag the live maps; verify.
