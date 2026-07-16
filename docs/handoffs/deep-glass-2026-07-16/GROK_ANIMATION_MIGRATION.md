# PDX Pride Guide — Animation / Motion Migration Brief (for Grok)

**Scope:** motion ONLY. You already have the surface/token brief (`GROK_MIGRATION_PROMPT.md`) and the per-agent tasks. This document is the companion for **animation standards** — what the design system already ships, what the new deep-glass standard adds, and how the two reconcile. Keep the existing motion vocabulary; layer the new deep-glass motions on top; retire nothing except where noted.

All motion lives in `client/src/components/ds/tokens/effects.css`. Reference the built implementation in `Card System.html` (search the mono section labels) and the day-tinted glow behavior throughout.

---

## 1. WHAT WE HAD (existing DS motion — keep all of it)

### 1.1 Motion tokens (canonical — do not change)
```
--ease-out:    cubic-bezier(.2,.8,.2,1);
--ease-spring: cubic-bezier(.34,1.56,.64,1);
--ease-inout:  cubic-bezier(.65,0,.35,1);
--dur-fast:   150ms;   /* snappy hover/press */
--dur-base:   220ms;
--dur-slow:   360ms;
--dur-pulse:  4s;      /* ambient neon pulse */
--press-scale: 0.97;
--hover-lift:  -2px;
```
- **0.15s snappy** on hovers/presses; **~4s ease-in-out** ambient pulses.
- Buttons **lift up-left on hover, press down-right**; cards **lift 2px**.

### 1.2 Signature keyframes (all remain)
- `pdxPulse` — ambient neon glow pulse keyed to `--dc` (14px→24px). Cards.
- `pdxSpotPulse` — slow magenta glow pulse. Spotted / Missed-Connections cards.
- `pdxReveal` — entrance fade + 5px rise (.28s).
- `pdxPop` — popover/menu fade + rise + slight scale (.18s ease-out).
- `pdxBlink` — live-status blink (going dots 1.6s; board live dots 1.8s).
- `pdxHeroIn` — utility hero fades up 10px over .48s; stats band +0.07s.
- `pdxMarquee` — horizontal ticker.

### 1.3 Web animation add-ons (2026, additive layers — keep)
- `pdxSeamFill` / `pdxSeamGlint` / `pdxSeamFlash` — page-load seam loader trio.
- `pdxEqBounce` — live-wave equalizer on the LIVE NOW strip.
- `pdxNumPop` / `pdxFloatUp` — stat count-up pop + floating +1.
- `pdxSparkFly` — RSVP tap confetti (drive with `--tx`/`--ty`).
- `pdxRingShimmer` — highlight arc orbiting identity rings (screen blend; never shifts flag colors).
- Split-flap — per-cell `rotateX` flip driven in JS (no shared keyframe).
- `pdxSeamFlow` + `pdxSeamGlow` — the **old** flowing+glowing rainbow divider (background flows L→R, glow pulses cyan→magenta). **See §3 — partially superseded.**

### 1.4 Entrance system (utility pages — keep the cascade)
Hero fades up 10px / .48s → stats band +0.07s → feeds .35s → compose panels .25s → modals .2s. Scroll-reveal utility fades sections in on enter.

### 1.5 Calm mode + reduced motion (the contract — keep and extend)
`[data-calm="true"]` / `.calm` and `@media (prefers-reduced-motion: reduce)` silence: grain, glitch, aurora, ticker, glows, entrance animation. Seams go **static** (rainbow stays visible, no flow/glint/glow). Day colors flatten to grey. **Flag/identity rings stay.** Every new motion below MUST honor this.

---

## 2. WHAT'S NEW (deep-glass motion — add these)

The OLED / deep-glass surfaces introduce three new keyframes plus behavioral changes. In the reference build these live in the helmet `<style>`.

### 2.1 `dirCardIn` — the universal card entrance (NEW, replaces raw `pdxReveal` on glass cards)
```
@keyframes dirCardIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
/* usage: animation: dirCardIn .5s ease both; */
```
- Every `--glass-card` enters with this — a **20px rise over .5s** (deeper/slower than the old 5px `pdxReveal`, to match the heavier glass slab). Stagger by index in a grid (e.g. `animation-delay: calc(var(--i) * 40ms)`).
- Keep `pdxReveal` for non-card text/section reveals; `dirCardIn` is the card-specific entrance.

### 2.2 `dirRefract` — the prismatic refraction seam (NEW, the calmer replacement for the flowing rainbow)
```
@keyframes dirRefract { from { background-position:200% 0; } to { background-position:0 0; } }
/* usage on the 2px edge-masked seam: animation: dirRefract 7s linear infinite; */
```
- A **thin 2px edge-masked** rainbow bar that slides its gradient position over **7s linear infinite** — quieter than the old `pdxSeamFlow`+`pdxSeamGlint`+`pdxSeamGlow` stack (no traveling glint, no pulsing box-shadow glow).
- Rides the top edge of glass cards and ad cards.

### 2.3 `pullHandle` — mobile nav pull-handle pulse (NEW)
```
@keyframes pullHandle {
  0%,100% { transform: translateY(0);    opacity:.7; }
  50%     { transform: translateY(-3px); opacity:1; background:#4a4a55; }
}
```
- The glowing-cyan handle above the mobile tab bar breathes up 3px on a slow loop, brightening at mid-cycle. See §2.8 of the surface brief (Navigation).

### 2.4 New behavioral rules for glass surfaces
- **Ambient glow is now always-on at rest** (the double neon bloom is baked into `--glass-card`), so `pdxPulse` becomes a *hover/emphasis* accent rather than the resting state on glass cards. On hover, brighten the existing bloom rather than adding a second shadow.
- **Hover/press unchanged:** keep `--hover-lift: -2px`, `--press-scale`, up-left hover / down-right press — the glass slab still lifts 2px.
- **Map pins** keep their tight resting bloom; no new pin animation (the old cyan pulse on pins is dropped — bloom is static, per the map surface spec).

---

## 3. RECONCILIATION (old ↔ new seams)

The app now has **two** rainbow-seam systems. Rule:
- **New deep-glass cards, ads, and map frames** use the thin `dirRefract` 2px seam (§2.2).
- **Page-level dividers, the header/footer seam, and the page-load loader** keep the existing `pdxSeamFlow`/`pdxSeamFill` trio (§1.3) — do not replace those; the flowing full-width divider is still the site-chrome signature.
- Do **not** put the old `pdxSeamGlow` pulsing box-shadow on card seams — glass cards carry their own bloom; a second pulsing glow double-stacks. Card seams = `dirRefract` only.

Retire: nothing from `effects.css`. Add: `dirCardIn`, `dirRefract`, `pullHandle`. Demote: `pdxPulse` from resting-state to hover-emphasis on glass cards (still used at rest on non-glass legacy elements).

---

## 4. CALM / REDUCED-MOTION for the new motions (required)
Add to the existing guards:
```
:root[data-calm="true"] .dir-refract,
:root[data-calm="true"] .dir-card,
:root[data-calm="true"] .pull-handle { animation: none !important; }
```
- `dirRefract` → seam becomes static (gradient frozen, still visible), matching the existing calm-seam rule.
- `dirCardIn` → cards appear with no rise/fade.
- `pullHandle` → handle static.
- The `@media (prefers-reduced-motion: reduce)` universal clamp (`animation-duration:.01ms`) already covers these; the calm-mode block must list them explicitly since calm sets `animation:none`.

---

## 5. Deliverables (motion only)
1. Add `dirCardIn`, `dirRefract`, `pullHandle` keyframes to `tokens/effects.css`.
2. Wire `dirCardIn` as the entrance on every `--glass-card` (with index stagger); wire `dirRefract` onto card/ad/map seams; wire `pullHandle` onto the mobile nav handle.
3. Demote `pdxPulse` to hover-emphasis on glass surfaces (keep resting bloom from the card token).
4. Keep every existing keyframe (§1) intact; keep the page-chrome seam trio for dividers/header/footer/loader.
5. Extend the calm-mode block (§4) to silence the three new motions; verify `prefers-reduced-motion` leaves the page fully static.

**Reference:** `Card System.html` (helmet `<style>` for `dirRefract`/`dirCardIn`/`pullHandle`), and `tokens/effects.css` for every existing keyframe and the motion tokens.

---

## 6. GITHUB AUDIT — corrections & the full feature-level catalog

After auditing the live repo (`maxmackpdx-pride/pdx-pride-guide@master`) the sections above are directionally right but three details differ from the shipped code, and there is a large feature-level animation layer that lives **outside** `effects.css`. Trust this section over §2–§3 where they conflict.

### 6.1 Corrections to §2 (real shipped values)
The directory card entrance/seam/glow is already implemented in `client/src/components/ds/PlaceCard.tsx` — do not invent new names:
- **Card entrance is `pgDirCardIn`, not `dirCardIn`:** `@keyframes pgDirCardIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}`, applied as `animation: pgDirCardIn .55s var(--ease-out) both`. (Real values: **22px / .55s / --ease-out** — not 20px/.5s.)
- **Glass-card hover is a 6px lift, not 2px.** `.pdxPlace--clickable:hover{ transform:translateY(-6px) }` and `.pdxPlace__body` gets `filter:brightness(1.08) saturate(1.08)` + `box-shadow:0 20px 44px -20px rgba(0,0,0,.85)` over `.16s ease`. The `--hover-lift:-2px` token still governs legacy/non-glass elements; deep-glass directory cards lift **6px**.
- **The card seam is the shared `pdx-rainbow-rule` class (3px), NOT a separate `dirRefract`.** PlaceCard's comment states it is "the same system as PlaceModal / site header." So there is really **one** rainbow-seam system reused at different heights, driven by `pdxSeamFlow` / `rainbow-divider-flow`. Treat `dirRefract` as an alias for that shared rule at card scale — do **not** author a second seam engine. (My §3 "two systems" framing is wrong; it's one system, reused.)
- **Resting glow is `--dir-gm`-driven.** `.pdxPlace__glow` = two-layer `box-shadow` keyed to `--_c` (accent) × `--dir-gm` (glow multiplier, default 60). Confirmed always-on at rest; `pdxPulse` is hover-emphasis. Calm mode should flatten by zeroing `--dir-gm`, not by removing the shadow rule.

### 6.2 Feature-level keyframes NOT in effects.css (must be preserved / ported)
`effects.css` is only the DS core. `client/src/index.css` and per-feature CSS carry ~80 more keyframes. Group them so no agent drops one:

- **Site chrome / index.css:** `glitch-word-cyan`, `glitch-word-magenta` (hero glitch text), `rainbow-divider-flow` (the full-width flowing seam — same engine as `pdxSeamFlow`), `site-nav-notify-pulse`, `spectrum-wave-scroll`, `auroraA/B/C` (ambient hero aurora), `spectrumBob`/`spectrumShimmer`/`spectrumSpin`, `floatY`, `floatOrb`/`glowPulse`/`hueSpin` (floating orbs), `ptr-spin` (pull-to-refresh).
- **Maps:** `map-pin-rsvp-pulse` (RSVP pin pulse — this is separate from the resting bloom; the map surface spec drops the *idle* pin pulse but RSVP-tap pulse stays).
- **Board:** `board-flickr`, `board-live-blink`, `board-hero-in`, `board-fade-in`, `grandOpeningPulse`, `scheduleCardIn`, `mp-rainbow-pulse`, `ph-count-pulse`.
- **Inbox / MC:** `floating-inbox-halo-pulse`, `inbox-overlay-in`, `inbox-overlay-fade`, `mc-bubble-float`, `msgRxnPop` (message-reactions), `exportGlow`.
- **Attendance:** `attendance-pop-in`, `attendance-sheet-up`, `attendance-badge-pulse`, `attendance-panel-in`.
- **Avatars/identity:** `avatar-glow-breathe` (identity-ring breathe — keep even in calm; it's identity, like the flag rings).
- **Component-scoped suites (keep as-is, they self-inject):** AffiliatePosterCard (`pdxAffiliatePulse`, `pdxAffiliateBlink`), EventsNowPanel (`enpPulse`, `enpMarquee`), NudeBeachesHubPanel (`nbHubPulse`), admin-stats (`adminStatsReveal/Bar/Wipe/EqBounce/Blink`), admin-panel (`adminSheetIn`), dashboard (`dash-blink`, `dash-skeleton-pulse`, `dashBadgePulse`), hub (`segSlide`, `hubDrawerFadeIn`, `hubDrawerGripNudge`, `hubBlink`, `hubNotifyBlink`), RiverBrats (`rb-dm-in`, `rb-pulse-blink`, `rb-on-site-pop`, `rb-checkin-in`, `rb-msg-in`, `rb-join-pop`), FlyerStash (`stashHolo`, `stashBlink`), ProfileHero (`pdxHeroIn`, `pdxSeamFlow` — locally redefined).
- **Print/affiliate variants:** `effects.css` also ships a `pdxa*` mirror set (`pdxaSeamFill/Glint/Flash`, `pdxaShimmer`, `pdxaEq`, `pdxaSpark`, `pdxaNumPop`, `pdxaFloatUp`) for the affiliate/print context — keep the mirror; don't merge into the `pdx*` originals.

### 6.3 Migration rule for the feature layer
When an agent restyles a section to deep-glass, **carry that section's existing keyframes forward untouched** — the deep-glass pass changes surfaces (bg, border, glow, seam), not the section's bespoke motion (blinks, count-ups, marquees, check-in pops). Only three global motions are genuinely new to author: `pgDirCardIn` (already in PlaceCard), the reused rainbow-rule seam at card scale, and `pullHandle`. Everything else in §6.2 already exists and must survive the migration.

### 6.4 Calm / reduced-motion (repo reality)
The repo already gates the big ambient effects (aurora, spectrum, glitch, grain, ticker, orbs) behind calm/reduced-motion. When porting, extend the SAME guard block to any newly-glassed section rather than adding per-section media queries. `avatar-glow-breathe` and flag/identity rings are the documented exceptions that stay animated.
