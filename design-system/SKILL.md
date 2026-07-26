---
name: zaylist-design
description: Use this skill to generate well-branded interfaces and assets for Zaylist (zaylist.com), the community-run Portland queer events guide, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, day-color system, type, fonts, assets, and UI kit components for prototyping.
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
  a `.d.ts` with typed props and JSDoc; most also have a `.prompt.md` usage snippet.
- `ui_kits/zaylist/` — an interactive recreation of core site surfaces (Home,
  Events, Schedule, Directory, Hub, Admin). Great reference for composition.
- `assets/` — logo lockup, Z mark and collage hero wallpapers. `app-face/` — the App face standards plus the home-screen and favicon exports (the source of truth for both) in `app-face/icons/`.

## Non-negotiable brand rules
- Two registers: the loud **zine layer** (heroes, events) and the calmer **utility
  layer** (boards, hub, admin: ink `#0c0c0f` panels, `#1c1c22` hairlines, softened
  neons, mono kickers). Pick the layer first.
- Near-black `#0a0a0a` base, `#0b0b0b` cards, hard `2px #2b2b2b` borders, minimal
  radius (brutalist; utility data tiles may go 10 to 12px). One neon per element.
- Acid yellow `#CCFF00` = primary action / RSVP. Cyan `#00FFFF` = accent + links.
  Magenta `#FF00CC` = the signature offset shadow and glows.
- Day colors are DATA. Use `var(--day-*)` tokens, never raw hexes, so calm mode works.
  The week is exactly MON Jul 13 to SUN Jul 19. Never invent an 8th day. Never use
  `#CCFF00` as a day color.
- Display type is Barlow Condensed 700 to 900, UPPERCASE, tight. Body is Inter. Mono
  (ui-monospace) is the third voice: utility kickers and labels, 10 to 12px, wide
  tracking, uppercase, colored.
- Signature effects: animated rainbow seam (flows, glints, glows; static in calm
  mode); brutalist magenta offset shadow on buttons (grows on hover, collapses on
  press); soft neon glow with a slow ~4s pulse; sitewide film grain.
- Voice: straightforward with a slight bro lean. Plainspoken, low-key, a little
  dry. Short sentences. "you" / "each other." Proudly solo-run. "Yas" and "gurl"
  are allowed in flair copy, never in functional UI. No protest or activist
  framing in our own copy. Event names and member posts keep their own language.
- The name pun: said out loud, Zaylist sounds like "the list." The joke is in the
  phrasing, not the spelling ("You're on Zaylist", "Is your party on Zaylist?").
  Always spelled Zaylist, one word, no apostrophe. One instance per screen, and
  never in nav, buttons, forms or legal.
- **Never use em dashes.** Use periods, commas, colons, or "to" for ranges.
