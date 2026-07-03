---
name: pdx-pride-guide-design
description: Use this skill to generate well-branded interfaces and assets for PDX Pride Guide (prideguidepdx.com), the community-run Portland Pride event guide, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, day-color system, type, fonts, assets, and UI kit components for prototyping.
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
  Inter), spacing, brutalist radius, effects (offset shadow, glow, pulse, calm mode).
- `components/` — React primitives (Brand, Forms, Data display, Layout, Map). Each has
  a `.prompt.md` with a usage snippet.
- `ui_kits/pride-guide/` — an interactive recreation of the whole site (Home, Events,
  Places, Hub, Admin). Great reference for composition.
- `assets/` — `logo.png` and collage hero wallpapers in `banners/`.

## Non-negotiable brand rules
- Near-black `#0a0a0a` base, `#0b0b0b` cards, hard `2px #2b2b2b` borders, minimal
  radius (brutalist). One neon per element.
- Acid yellow `#CCFF00` = primary action / RSVP. Cyan `#00FFFF` = accent + links.
  Magenta `#FF00CC` = the signature offset shadow and glows.
- Day colors are DATA. Use `var(--day-*)` tokens, never raw hexes, so calm mode works.
  The week is exactly MON Jul 13 to SUN Jul 19. Never invent an 8th day. Never use
  `#CCFF00` as a day color.
- Display type is Barlow Condensed 700 to 900, UPPERCASE, tight. Body is Inter.
- Signature effects: rainbow-bar divider; brutalist magenta offset shadow on buttons
  (grows on hover, collapses on press); soft neon glow with a slow ~4s pulse.
- Voice: conversational, cheeky, caring, activist. "you" / "each other."
- **Never use em dashes.** Use periods, commas, colons, or "to" for ranges.
