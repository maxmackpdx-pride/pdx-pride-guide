# Handoff: Promoter hub redesign

## Overview
Redesign of Zaylist promoter page (`/submit`, `client/src/pages/Submit.tsx`). The old
page was confusing: four sibling paths thrown at the user at once, two stacked "how it works"
panels, a two-screen submit stepper, and unclear rules about when a submission goes live. This
redesign keeps all four paths but makes each one's audience and outcome unmistakable, collapses the
submit flow to a single page, and surfaces the go-live rule as a status chip on every path and form.

**Start here:** `GROK_PROMPT.md` is the task brief written for the implementing agent. It names the
exact file to edit, what must not change, the layout decision, the smoke test, and the deploy steps.
This README is the design spec it references.

## About the design files
`Promoter Hub.dc.html` is a **design reference built in plain HTML** — a prototype showing the
intended look, copy, and behavior. It is **not production code to copy**. Recreate it inside the
existing React + TypeScript app (`client/src/pages/Submit.tsx`) using the repo's own components and
CSS tokens. Do not ship the HTML.

The HTML file uses the bound design system's component bundle and token CSS by relative path, so it
will only render inside this design project, not standalone.

## Fidelity
**High-fidelity** for structure, IA, copy, and color. Recreate the layout, chip vocabulary, spacing
rhythm, and copy faithfully, but express everything with the app's existing components
(`BoardHero`, `PageHeader`, `BoardStatsBar`, `Button`, `BoardFilterChip`, `EventTypeTag`,
`BoardCloseSeam`, `ScrollReveal`) and the `--panel-*` / `--neon-*` tokens in `client/src/index.css`.

## Prototype scaffolding to drop
The mockup has two toggle bars at the very top: **Preview as** (New visitor / Member / Verified /
Pending) and **Landing** (Layout A / B / C). These exist only so the reviewer can preview states and
compare directions. **Do not port them.** Real account state comes from `useAuth()`. Ship one landing
layout — default **Layout A (Sorter)**.

## Screens / Views

### 1. Landing (the hub)
- **Purpose:** route the visitor to the right one of four paths, fast, with the go-live rule visible.
- **Layout:** centered column, max-width 1080px, 24px side padding. Top to bottom: page chrome
  (breadcrumb "HOME · PROMOTERS", title "Promoter hub" with "hub" in `--panel-lime`, lede, rainbow
  `Divider`), then a 3-up `BoardStatsBar` band (214 Live in the guide / 37 Unclaimed, open to grab /
  68 Venues repping Pride), then the state banner, then the four path rows, then the Submit-vs-Apply
  clarifier (non-verified only), then `BoardCloseSeam`.
- **Path row (Layout A):** full-width button, grid `auto 1fr auto` (number / text stack / arrow),
  `--panel-card` background, 1.5px `--panel-border`, a 4px left border in the path accent, 12px
  radius, 22px/24px padding, hover to `--panel-card-2`. Text stack: title (Barlow Condensed 800,
  ~1.5rem, uppercase, white), one line combining who-it-is-for (bold white) + outcome (`--text-body`),
  and a status chip.
- **Status chip:** mono, ~0.63rem, 0.12em tracking, uppercase, 700, black ink (`#06060a`) on the
  accent fill, 4px/10px padding, 5px radius.

The four paths, their accents, and their chips (chip text/color depend on account state):

- **Submit an event** — accent `--panel-lime`. "You're running it. Put your event on the guide."
  Chip: verified `Goes live now` (lime), else `Reviewed first` (cyan).
- **Claim a listing** — accent `--panel-cyan`. "It's listed, not yours yet. Take the host seat on an
  event already up." Chip: same rule as Submit.
- **Apply as promoter** — accent `--panel-purple`. "Not posting yet, want the fast lane later. Get
  verified once. Skip the queue after." Chip: `One-time review` (purple). **Hidden for verified users.**
- **Spotted an event** — accent `--panel-magenta`. "Not yours, the guide is missing it. Tip us and
  we will chase it down." Chip: `No promoter status` (magenta).

- **State banners (one at a time):**
  - Verified: lime border, "Verified promoter — everything goes live instantly."
  - Pending: cyan border, "Application pending — you can still submit and claim now."
  - Logged out: lime left-border, "Free account needed for most paths" + a "Log in / Join" button.
    Copy must state Spotted needs an account but **not** promoter status.
- **Submit-vs-Apply clarifier (non-verified only):** `--panel-card` panel, orange mono kicker, two
  columns. Submit (lime) posts your event now and verifies you in the same step; Apply (purple) just
  verifies you for later.

### 2. Submit form
- Back-to-hub link, lime kicker, "Add your event", a status-chip note row (chip = `Goes live now` /
  `Reviewed first`, plus `submitNote` copy).
- **Non-verified:** section "1 · About you (one time)" (org, link, about-you textarea), then
  "2 · Your event". **Verified:** only the "Your event" section. This replaces the old two-screen
  `submitStep` navigation with one page.
- Event fields (2-col grid, full-width rows use `grid-column:1/-1`): title, description, venue name,
  neighborhood (select), address, day (select), age (select), start + end (datetime-local),
  admission (select), ticket link. Then "Event tags" toggle chips, then "Flags" toggle chips
  (House party / Sex positive / Nudity OK). Selecting House party reveals a red warning that house
  parties are public.
- Submit button (`Button` variant solid, accent lime, lg, block, arrow): label `Submit event, goes
  live now` (verified) or `Submit event for review`.

### 3. Apply form
Back link, purple kicker "Promoter verification", "Apply as promoter". Disabled name + email
(autofilled from auth), org, link, about-you textarea. Cyan solid submit button "Submit application".

### 4. Spotted form
Back link, magenta kicker "Community tip", "Spotted an event". Copy: needs a free account, no
promoter status. Fields: event name, venue/location, day (select), link, "Where did you spot this?"
textarea. Pink solid button "Send tip". Footnote: tips go to the team only.

### 5. Claim form
Back link, cyan kicker "Host your listing", "Claim an event", status-chip note row. Event-to-claim
select (populated from `/api/events/unclaimed`), connection/proof textarea. Cyan solid button:
`Claim this event` (verified) / `Submit claim for review`.

### 6. Success states (one per flow)
Centered card, colored border matching the flow accent, a filled circle check, title + body, and a
"Back to hub" link. Submit/claim titles + bodies differ for verified vs not (live now vs in review).

## Interactions & behavior
- Clicking a path (logged in) opens its form; logged out opens `AuthModal` (existing).
- Each form submit calls the existing mutation, then shows the matching success state.
- Chip text/color, form notes, button labels, section labels, and success copy are all derived from
  `isVerified` (`promoterStatus === "approved" || isAdmin`) and `promoterStatus === "pending"`.
- Hover: path rows/cards lift background to `--panel-card-2`; buttons keep the DS brutalist offset.
- Preserve deep links: `?mode=apply`, `?mode=claim`, `/submit/claim/:eventId`.

## State management
Reuse what `Submit.tsx` already has: `useAuth`, `mode`/`view`, `promoterStatus`, `eventForm`,
`promoterForm`, `unclaimedEvents`, `allEvents`, `applyMutation`, `eventMutation`,
`handleSubmitWithEvent`. The only state simplification: the non-verified submit no longer navigates
between two screens — both sections render together.

## Design tokens (from `client/src/index.css`)
- Surfaces: `--panel-ink #06060a` (page), `--panel-band #070708`, `--panel-card #0c0c0f`,
  `--panel-card-2 #0d0d10`, `--ink-850 #111` (inputs), `--ink-1000 #050505`.
- Borders: `--panel-border #1c1c22`, `--panel-border-2 #24242c`.
- Accents: `--panel-lime #c8fa3c`, `--panel-cyan #19e3ff`, `--panel-magenta #ff1fa0`,
  `--panel-purple #b06bff`, `--panel-orange #ff8c00`. Status bad `#FF4D4D`.
- Text: `--text-hi #fff`, `--text-body #e6e2d9`, `--text-body-muted #c8c4bb`, `--text-lo #999`,
  `--text-faint #666`. Chip ink `#06060a`.
- Type: display `--font-display` (Barlow Condensed, 800/900, uppercase); body `--font-body` (Inter);
  mono `ui-monospace` for kickers/labels/chips (10 to 12px, 0.12 to 0.2em tracking, uppercase).
- Radius: 8px inputs, 10 to 14px cards/panels. Card border 1.5px; path accent border 3 to 4px.
- Page title: paper `#f7f5ee`, 1px black text-stroke, hard `2px 2px 0 #000` shadow.

## Assets
None. No images or icons beyond inline text glyphs (arrow, check) and the design system's own
`Divider` / `Button` / `StatCard` visuals.

## Files
- `Promoter Hub.dc.html` — the design reference (all views + both prototype switchers).
- `GROK_PROMPT.md` — the implementer's task brief (connect to GitHub, edit `Submit.tsx`, smoke test,
  deploy).
- Target in the app: `client/src/pages/Submit.tsx`; tokens in `client/src/index.css`.
