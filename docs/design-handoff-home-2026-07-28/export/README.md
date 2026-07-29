# Zaylist home stage: drop-in patch

This folder replaces **one thing only**: the home page hero area. Everything else on
zaylist.com (header, footer, seams, events feed, boards, hub) stays exactly as it is.

Files:

- `zaylist-home-stage.html` — the whole patch: markup, stage keyframes, and a ~60-line
  vanilla runtime. Open it in a browser to see the finished thing.
- `assets/` — the eight media files the stage references.

## What it is

A single stage the height of the old hero (`clamp(396px, 69vh, 690px)`) holding seven
slides: the home hero, then one slide per board (Events, Haüsing, Gifting, Gig Board,
Missed Connections). One video wallpaper, one aurora + letter-orb layer, one grain pass
sit **behind all seven** and never restart, so moving between boards feels like panning
across one room instead of loading five pages. Chevrons left/right, arrow keys, and each
slide's own copy and buttons are unchanged from the live boards.

## Install

1. Copy `assets/` to `client/public/home/` (or wherever the home hero media already
   lives) and update the `src` paths in the markup to match.
2. Delete the two `PREVIEW ONLY` `<link>` tags in `<head>`. The tokens, glass classes
   (`pdx-glass-card`, `pdx-glass-btn`, `pdx-refract-seam`, `pdx-glass-rebind`) and the
   fonts already load site-wide from `client/src/index.css`.
3. Keep the second `<style>` block (the one after the PREVIEW comment). It only holds
   stage keyframes (`zlOrb1..3`, `zlLetterOrb`, `zlFloat`, `zlGlitchA/B`, `zlGlitchSlip`,
   `zlBlink`, `zlHeroIn`) and the calm-mode / reduced-motion overrides.
4. Paste everything between `<!-- ==== ZAYLIST HOME STAGE: paste from here ==== -->` and
   `<!-- ==== to here ==== -->` in place of the current home hero block, then the
   `<script>` that follows it.
5. Nothing else on the page changes. Do not remove the site's rainbow seam, header, or
   footer: the stage sits between them.

## Sample cards link to real posts

Each board slide carries one sample post on the right. They are real anchors, already
pointing at the live permalink shape, so swapping in real data is one string each:

| Slide | Current `href` | Real pattern |
| --- | --- | --- |
| Events | `/events/1042/champagnes-catch-a-rising-star` | `/events/:id/:slug` |
| Haüsing | `/hausing/318/wildrose-haus` | `/hausing/:id/:slug` (board is queued) |
| Gifting | `/gifting/2871/free-moving-boxes` | `/gifting/:id/:slug` |
| Gig Board | `/pride-work/914/coat-check-two-people` | `/pride-work/:id/:slug` |
| Missed Connections | `/spotted/4405/blue-buzzcut-back-patio` | `/spotted/:id/:slug` |

Render them from the newest live listing per board and the homepage becomes a live front
door. Each card is the same deep-glass shell rebound to its board accent through `--c`
(`--day-fri`, `--panel-cyan`, `--panel-lime`, `--panel-purple`, `--panel-magenta`), with
the same anatomy: live dot + mono kicker + DEMO sticker, square thumb, condensed title,
one muted line, then a hairline seam with mono meta and the board's own CTA. Drop the
DEMO sticker span once the data is real. Missed Connections uses a quote tile instead of
a photo because those posts are anonymous.

Cards hide below 680px (the copy column owns the slide on phones); flip that in the
runtime's `mq` if you want them on mobile too.

## Modes

- **Calm mode** works: `data-calm="true"` on `<html>` kills the video, orbs, grain,
  glitch and blink, exactly like the rest of the site. The runtime watches the attribute,
  so the header's CALM toggle needs no extra wiring.
- **Reduced motion** is handled by the same rules plus a media query.
- Keyboard: left/right arrows move between slides; every card and button is a real
  focusable link.

## Notes

- No new tokens, colors, radii, shadows, or components were introduced. Every value is a
  `var(--*)` from `client/src/index.css` with the shipped fallback inline.
- Voice and microcopy are unchanged from the live boards, including the three-beat
  mantras in each slide's close seam.
- The stage does not scroll internally: each slide composes to the stage box at any
  height, so the fold never cuts a card in half.
