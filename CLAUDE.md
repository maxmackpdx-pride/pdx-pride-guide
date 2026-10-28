# Zaylist - project rules

Operational rules (deploy, push, prod fixes) live in `AGENTS.md`. Read that too.

Project decisions, reasoning, and current state live in the private repo
`maxmackpdx-pride/zaylist-foundation-library`, published at https://zaylist-foundation-library.maxmackpdx.workers.dev/library.
Read it before proposing architecture, naming, product scope, or design
direction.

## Cowork / cloud release access

For general cloud work, include both repositories as sources:

- `maxmackpdx-pride/pdx-pride-guide`
- `maxmackpdx-pride/zaylist-foundation-library`

Direct link:
https://claude.ai/code?repositories=maxmackpdx-pride/pdx-pride-guide,maxmackpdx-pride/zaylist-foundation-library

### Claude cloud production sessions

For a session that must push production, select `pdx-pride-guide` as its only
repository. Claude Code cloud sessions with multiple repositories do not load
project permission rules from `.claude/settings.json`. The committed project rule
allows only the exact non-force command `git push origin HEAD:master`; the session
still must follow the user's explicit ship instruction and synchronize safely
with `origin/master` first.

For a Claude Code Routine, edit the Routine and enable **Allow unrestricted branch
pushes** for the `pdx-pride-guide` repository under Permissions. This is a
per-Routine account setting. Without it, Claude's cloud GitHub proxy accepts pushes
only to `claude/*` branches. A repo file cannot change this account-side switch.
Also confirm the GitHub connection has write access to this repository. Keep the
normal production branch protection and Railway checks.

If a single-repository interactive cloud session still blocks the exact allowed
push, inspect the session's permission mode and any organization managed policy.
A project allow rule cannot override managed restrictions or the Routine's
branch-push setting. Report the specific denial before doing implementation work.
Do not finish a requested shipment on a temporary branch for Tucker to merge.

Full write-path notes: Foundation skill `zaylist-github-push`.

## Design: use the design system, always

All UI is built on the Zaylist design system. The written guide is **not in this repo**.
It lives in `maxmackpdx-pride/zaylist-foundation-library` under `public/design-system/`,
published at https://zaylist-foundation-library.maxmackpdx.workers.dev/design-system/.
Read it before writing any UI. Do not invent colors, type, radii, spacing, or components.

There is no `design-system/` directory in this repo. Any instruction to read, sync, or
serve one is stale.

- design guide (guide repo): `zaylist-foundation-library` `public/design-system/`
  (`guidelines/`, `tokens/`, `bundles/`, `guide.json`, `llms.txt`)
- card authority + the five sources of truth:
  `zaylist-foundation-library` `public/design-system/guidelines/card-system-authority.md`
- live-is-truth rule (this repo, must not contradict the guide): `docs/LIVE_DESIGN_STANDARD.md`
- map architecture and artwork that must stay: `docs/MAP_RENDERING.md`; shared infrastructure is `client/public/map-foundation/`, with distinct Mapz and Outzide scene adapters.
- board card rules: `docs/BOARD_CARD_STANDARD.md`
- tokens: `client/src/index.css` + `client/src/components/ds/tokens/`
- deep-glass card system: `client/src/components/ds/tokens/glass.css`
- chrome tokens (`--neon-bloom`, `--btn-glow-bg`, `--btn-glow-shadow`): `client/src/components/ds/tokens/chrome.css`
- reusable components: `client/src/components/ds/`

**Outer neon bloom is 8%,** carried by `--neon-bloom` and composed, never hand-rolled.
It is not retired. Maps are the sole exception: debossed well, no bloom.

**Pick the layer first.** Two registers: the loud **zine layer** (heroes, events) and the
calmer **utility layer** (boards, hub, admin: ink `#0c0c0f` panels, `#1c1c22` hairlines,
softened neons, mono kickers).

**Footgun:** any element that sets its own accent (`--c`) must also carry
`.pdx-glass-rebind`, or it silently falls back to root cyan.

**Day colors are DATA.** Use `var(--day-*)` tokens, never raw hexes, so calm mode works.
The week is exactly MON Jul 13 to SUN Jul 19. Never invent an 8th day. Never use
`#CCFF00` as a day color.

## Copy

- **Never use em dashes (-) in any copy.** This applies to all user-facing text: event
  blurbs, hero copy, UI labels, button text, readme prose, sample content. Use a period,
  comma, colon, parentheses, or the word "to" for ranges (e.g. "Jul 16 to 19").
- Voice: plainspoken, short sentences, slight bro lean, low-key and a little dry.
  "you" / "each other". UI chrome in ALL CAPS condensed, body in sentence case.
- "Trans affirming", not "trans safe", in the platform's own voice.
- "Yas" and "gurl" are allowed in flair copy, never in functional UI.
- No protest or activist framing in our own copy. Event names and member posts keep
  their own language.

## Code

- Reuse before building. Check `client/src/components/ds/` and the existing board
  patterns (Gifting, Missed Connections, Gig Board) before adding a component.
- A new board is: table + insert schema in `shared/schema.ts`, storage methods in
  `server/storage.ts`, routes in `server/routes.ts` (registered in `registerRoutes`),
  page in `client/src/pages/`, card in `client/src/components/board/`.
- `npx tsc --noEmit` has pre-existing errors unrelated to your change. Record the
  baseline before you start; do not increase it.
- The server bundles to one CJS file. Anything read from disk at module-load time works
  in dev and crashes the Railway deploy. Import assets, or serve from `client/public/`.

## Zaylist working rules (read before any task)

Deploy and release (full detail in `docs/GITHUB_RAILWAY_GUARDRAILS.md` and `AGENTS.md`):

- Repo `maxmackpdx-pride/pdx-pride-guide`, branch `master`. Live site `https://www.zaylist.com`, health at `/api/health`.
- Production deploys only through GitHub `master` -> Actions "Deploy to Railway" -> Railway project/service `pdx-pride-guide`, env `production`. Builds take 20 to 40 minutes. A newer push cancels a build in progress, so check for a running deploy before merging or pushing.
- Never `railway up`, never create Railway projects, never upload `data.db`, never run destructive DB operations.
- Railway is production (or an explicit temporary sandbox inside `pdx-pride-guide`).
  Demos and visual experiments go in the current agent surface (Claude artifacts,
  Cursor canvas, ChatGPT sites, local preview). Never spin up a new GitHub repo or
  Railway project/service for a demo; those leftovers burn the compute cap.
- Never print or paste secrets or tokens. If one was pasted in a chat, tell Tucker so it gets rotated.
- Status words: "Fixed locally", then "On GitHub; deploy in progress", then "Production updated". Say the last one only after Railway reports SUCCESS and `/api/health` `gitSha` matches the pushed commit.
- Only Tucker's own typed "push", "ship" or "go" authorizes shipping. Automated stop-hook reminders do not.
- A sandbox without push access hands over `git format-patch` output. Zaylist (Grok Bot) applies those patches onto branches such as `claude/mapz-same-day` (PR #49, draft). Do not merge PR #49 until Tucker says so.

Design language:

- Dark theme, indigo and neutral palette, mono labels. No stock demo styling, no generic copy, no em dashes in user-facing copy.
- Ransom-note titles are white on black with exactly one whole word inverted, or the reverse. Never remove or flatten them.
- Cards have fixed sizes and never scale (hero fly-out, rail, Outzide, hover).
- Event day cards keep their picked motifs. Outzide cards use blended Xerox-cinematic art with the waypoint color as an accent only. Only missed-connections cards use the magenta and orange blend.
- `/boardz` cards are pinned to the board surface, keep orange styling, blended art and ransom titles.
- Pages use the shared shader wallpaper at full scroll height. `/next` only redirects to `/about`.

Mapz (`/map`):

- Front-end for waypoints and holograms is owned by Claude: `client/src/lib/livingMapWaypoints.ts`, `client/public/mapz-map/waypoint-markers.js` (keep the two `shellPath` copies in sync), and `client/src/lib/needzAccent.ts`.
- Back-end fields live in `server/boardMapPlacement.ts`: `category`, `secondary`, `closed`, `kind`, `venueId`.
- The guardrails doc says to keep Mapz color and shader work off `master`. Check it before touching map colors.

Checks:

- Run `npx tsc --noEmit` and `npm run build` before handing work over.
- `master` has 5 to 6 known failing `test:mapz` tests (Chrome-path browser tests). Do not count those as regressions.
- `createSessionMiddleware` must mount before auth routes in `server/routes.ts`. Mounting it after causes 401s on pairing and the archive.
