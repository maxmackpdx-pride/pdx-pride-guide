# Zaylist rebrand report (local only)

**Branch:** `rebrand/zaylist`  
**Scope:** Product name + visual identity rebrand from PDX Pride Guide → **Zaylist**.  
**Publish:** none (no push, no deploy, no PR).

## Summary

| Area | Status |
|------|--------|
| Product name strings (`PDX Pride Guide` / `Pride Guide`) | Replaced with **Zaylist** across client/server/shared/docs |
| Display wordmarks (Home hero, Logo, Admin, Profile, Inbox) | **ZAYLIST** / **Z** |
| PWA / favicon / apple-touch | Regenerated from dark Z tile |
| Spectrum gradient `--grad-rainbow` | 9-stop Zaylist tape (wraps to magenta) |
| `shared/prideWeek.ts` | Renamed → `shared/eventWeek.ts` + symbol renames |
| GitHub repo path | **Restored** to `maxmackpdx-pride/pdx-pride-guide` (remote not renamed) |
| Domain in meta/copy | Placeholder **zaylist.com** (confirm before go-live) |
| System username `prideguidepdx` | **Left intact** (data identity) — see review list |

## Assets installed

| Path | Source |
|------|--------|
| `client/public/brand/z-icon-dark.png` | icons_export/app-icons |
| `client/public/brand/z-icon-light.png` | icons_export/app-icons |
| `client/public/brand/zaylist-logo-alpha.png` | icons_export/app-icons |
| `client/public/brand/zaylist-logo-on-white.png` | icons_export/app-icons |
| `client/public/brand/zaylist-avatar.jpg` | generated from dark Z |
| `client/public/brand/line-icons/*.svg` | icons_export/line-icons (32) |
| `client/public/favicon.png` | generated 32px |
| `client/public/icons/icon-{192,512}.png` | generated |
| `client/public/icons/icon-512-maskable.png` | generated (larger safe zone) |
| `client/public/icons/apple-touch-icon.png` | generated |
| `client/public/logo-wordmark.png` | scaled alpha wordmark |
| `client/src/assets/logo.png` / `logo-wordmark.png` / `hub-logo.jpg` | updated |

### Asset TODOs (optional polish)

- [ ] Dedicated **og-preview.jpg / .png** with ZAYLIST lockup (currently still old collage)
- [ ] Smaller optimized nav wordmark (current alpha PNG is large; nav uses contain)
- [ ] Delete legacy filename `client/public/brand/pdx-pride-guide-avatar.jpg` once no callers
- [ ] Confirm whether `gift-with-pride-hero.jpg` / `pdx-skyline-neon.jpg` stay as community art (not product brand)
- [ ] Wire line-icons into UI components if desired (currently only stored under `client/public/brand/line-icons/`)

## Identifier / file renames

| Old | New |
|-----|-----|
| `shared/prideWeek.ts` | `shared/eventWeek.ts` |
| `PRIDE_WEEK_START_DATE` | `EVENT_WEEK_START_DATE` |
| `PRIDE_WEEK_END_DATE` | `EVENT_WEEK_END_DATE` |
| `PRIDE_WEEK_DAYS` | `EVENT_WEEK_DAYS` |
| `PRIDE_WEEK_DAY_OPTIONS` | `EVENT_WEEK_DAY_OPTIONS` |
| `PrideWeekDay` | `EventWeekDay` |
| `prideWeekDate` / `prideWeekNextDate` | `eventWeekDate` / `eventWeekNextDate` |
| `isPostPrideListingCapActive` | `isPostEventWeekListingCapActive` |
| `defaultPrideDateTimes` | `defaultEventWeekDateTimes` |

Imports updated across client/server/shared (~37 files). CSS class names like `.pride-work-hero`, route `/pride-work` left for review (functional, not product title only).

## Gradient

```css
--grad-rainbow: linear-gradient(100deg, #FF19D6 0%, #FF196C 12%, #FF5319 24%, #FFD119 34%, #9CFF19 44%, #5BFF19 54%, #19F7FF 66%, #1956FF 76%, #E419FF 90%, #FF19D6 100%);
```

Updated in: `client/src/index.css`, `client/src/components/ds/tokens/colors.css`, `client/src/sandbox/ds/tokens/colors.css`, `sandbox/design-system/source/tokens/colors.css`, `design-system/tokens/tokens.css`.

## Review list — do not auto-change (standalone “pride” / identities)

These are **not** the product brand “Pride Guide”; left as-is pending human decision.

### System / data identities (high risk if renamed without migration)

| File | Note |
|------|------|
| `server/storage.ts` `GUIDE_ADMIN_USERNAME = "prideguidepdx"` | Live inbox system user |
| `client/src/components/inbox/useAdminGuideThreads.ts` username `prideguidepdx` | Admin guide threads |
| `server/routes.ts` comments about `@prideguidepdx` outbound | Same identity |
| `server/analytics.ts` host includes `prideguidepdx` | Traffic classification |
| DB usernames / rows already stored as `prideguidepdx` | Needs migration plan if renamed to `zaylist` |

### Community / event language (recommended keep or soft rewrite later)

| Area | Examples | Suggested default |
|------|----------|-------------------|
| Pride Week calendar | `docs/PRIDE_WEEK_13_19_PLAN.md`, day labels, “Portland Pride 2026” SEO | Keep as event copy, not product name |
| Route `/pride-work` + `PrideWork.tsx` | Gig board path | Consider `/gigs` later; not renamed this pass |
| CSS `.pride-work-*`, `.home-hero-title-pride` | Layout hooks | Safe to leave; rename only with CSS audit |
| Pride glow / flag tokens | `PrideGlowNudge`, `--flag-*`, “pride bloom” | Community feature — keep |
| FlyerStash ladders “PDX SOUND LEGEND” | Geographic slang | Keep |
| PlaceModal “upcoming Pride events” | Event-scoped | Soft: “upcoming events” |
| `calendarLinks` uid prefix `pdx-pride-` | Technical id | Optional rename to `zaylist-` |
| window `__PDX_LOCAL_PREVIEW__` | Dev flag | Optional later |

### Domain confirmation needed

- Meta / OG / share URLs now say **https://www.zaylist.com** (placeholder per rebrand prompt).
- Live production is still **prideguidepdx.com** until DNS + Railway cutover.
- GitHub remains **maxmackpdx-pride/pdx-pride-guide**.

## Build / check

- `npm run check` (tsc): existing failures in `server/qsearch/analyze.ts`, `server/storage.ts` follow APIs, ingest — **not introduced by rebrand** (no eventWeek/Zaylist errors).
- Full production build not run in this pass (optional local `npm run build`).

## Working tree size

~215 paths touched (code + assets + docs). See `git status` on `rebrand/zaylist`.

## Commits (local)

Planned small commits on this branch only — no push.
