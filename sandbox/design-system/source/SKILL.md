---
name: zaylist-design
description: Use this skill to generate well-branded interfaces and assets for Zaylist (zaylist.com), the community-run Portland Pride event guide, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, day-color system, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets
out and create static HTML files for the user to view. If working on production code,
copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to
build or design, ask a few questions, and act as an expert designer who outputs HTML
artifacts or production code, depending on the need.

## Fast orientation
- `readme.md` — full design guide: voice, visual foundations, the day-color system,
  iconography, component index, and caveats. Read this first.
- `styles.css` — the single stylesheet to link; it `@import`s everything in `tokens/`.
- `tokens/` — colors (incl. `--day-mon` .. `--day-sun`), type (Barlow Condensed +
  Inter), spacing, radii, glass/chrome (`--glass-card*`, `--neon-bloom`,
  `--btn-glow-bg`, `--btn-glow-shadow`), effects (calm mode, motion).
- `components/` — React primitives (Brand, Forms, Data display, Layout, Map). Each has
  a `.prompt.md` with a usage snippet.
- `ui_kits/pride-guide/` — an interactive recreation of the whole site (Home, Events,
  Places, Hub, Admin). Great reference for composition.
- `assets/` — `logo.png` and collage hero wallpapers in `banners/`.

## Non-negotiable brand rules
- **Deep glass is the card standard.** Every normal card is one shell: near-black OLED
  fill, black keyline, neon edge, two sheens, rainbow refract seam, and floor bloom. The
  old brutalist slab (flat `#0b0b0b` with a hard `2px #2b2b2b` border and nothing else)
  is retired. One neon per element.
- Set one semantic accent with `--c`, then recompute its dependent recipes with
  `.pdx-glass-rebind`. A local `--c` without a rebind is a defect.
- **Outer neon bloom is 8%,** carried by `--neon-bloom`. Compose it; never hand-roll a
  glow shadow. Maps are the sole exception: debossed well, no bloom at all.
- **Buttons use the glow treatment:** dark plate, accent rim and ink, lit top edge, dark
  inner floor, 8% bloom outside, composed from `--btn-glow-bg` and `--btn-glow-shadow`.
  The solid accent fill is reserved for the one primary action on a surface.
- Acid yellow `#CCFF00` = primary action / RSVP. Cyan `#00FFFF` = accent + links.
  Magenta `#FF00CC` is an accent. It is **not** a default button shadow: the brutalist
  magenta offset is retired, and `--brutal-shadow*` survives for intentional stickers only.
- **Navigation glow is a hover affordance only.** The current page keeps its accent on rim
  and label with no standing bloom and no pulse. Dropdown panels are one plain column;
  there is no featured card, and the sitewide bottom-nav pull handle stays retired.
- Day colors are DATA. Use `var(--day-*)` tokens, never raw hexes, so calm mode works.
  The week is exactly MON Jul 13 to SUN Jul 19. Never invent an 8th day. Never use
  `#CCFF00` as a day color.
- Display type is Barlow Condensed 700 to 900, UPPERCASE, tight. Body is Inter.
- Signature effects: rainbow-bar divider and refract seam; deep-glass sheen and floor
  bloom on cards; the 8% `--neon-bloom` composed on tags, tape, kickers, pills, badges,
  seams and buttons.
- Voice: conversational, cheeky, caring, activist. "you" / "each other."
- **Never use em dashes.** Use periods, commas, colons, or "to" for ranges.
