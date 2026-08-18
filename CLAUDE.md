# Zaylist - project rules

Operational rules (deploy, push, prod fixes) live in `AGENTS.md`. Read that too.

Project decisions, reasoning, and current state live in the private repo
`maxmackpdx-pride/zaylist-foundation-library`, published at https://zaylist-foundation-library.maxmackpdx.workers.dev/library.
Read it before proposing architecture, naming, product scope, or design
direction.

## Cowork / cloud sessions must include both repos

If this session cannot `git push` (`authorized repository set` / proxy 403),
it started without the repo as a source. PAT-in-URL will not fix it.

Start (or restart) the session with **both** sources:

- `maxmackpdx-pride/pdx-pride-guide`
- `maxmackpdx-pride/zaylist-foundation-library`

Direct link:
https://claude.ai/code?repositories=maxmackpdx-pride/pdx-pride-guide,maxmackpdx-pride/zaylist-foundation-library

Full write-path notes: Foundation skill `zaylist-github-push`.

## Design: use the design system, always

All UI is built on the Zaylist design system in **`design-system/`**, registered as the
`zaylist-design` skill. Invoke it (or read `design-system/README.md`) before writing any
UI. Do not invent colors, type, radii, spacing, or components.

- tokens: `client/src/index.css` + `design-system/tokens/`
- deep-glass card system: `client/src/components/ds/tokens/glass.css`
- reusable components: `client/src/components/ds/`
- live-is-truth rule: `docs/LIVE_DESIGN_STANDARD.md`
- board card rules: `docs/BOARD_CARD_STANDARD.md`

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
