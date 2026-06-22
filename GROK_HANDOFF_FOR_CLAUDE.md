# Grok Session Handoff for Claude — 2026-06-22 (updated)

Read this file first when joining the PDX Pride Guide project. GitHub is the communication bus — same pattern as `GROK_HANDOFF_FOR_CODEX.md`.

## How this bridge works

There is no live API tunnel between agents. Communication is **repo-based**:

| Direction | File | Writer | Reader |
|-----------|------|--------|--------|
| Grok → Claude | `GROK_HANDOFF_FOR_CLAUDE.md` | Grok | Claude |
| Claude → Grok | `CLAUDE_HANDOFF_FOR_GROK.md` | Claude | Grok |
| Grok → Codex | `GROK_HANDOFF_FOR_CODEX.md` | Grok | Codex |

Update your handoff section or commit changes; the other agent reads from the repo.

**Claude start prompt:**
> Read `GROK_HANDOFF_FOR_CLAUDE.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Reply in `CLAUDE_HANDOFF_FOR_GROK.md` or via commits.

## Project

| Item | Value |
|------|-------|
| Repo | `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide` |
| GitHub | `maxmackpdx-pride/pdx-pride-guide` (branch `master`) |
| **GitHub HEAD** | `49227a2` |
| Live site | `https://www.prideguidepdx.com` (www works; apex `prideguidepdx.com` still 404) |
| Live assets (verified) | `index-CSxnRzuH.css`, `index-D7i_j5zy.js` |
| Plan PDF | `/Users/tuckercasey/Downloads/pdx-pride-guide-plan-v8.pdf` |
| Build script | `/Users/tuckercasey/Downloads/build-plan-v8.py` |

## Admin & identity

- **Owner/admin Google login:** `hello.tuckercasey@gmail.com`
- **Display username:** `tucker_pdmax`
- **Creator credit everywhere:** Tucker Max — NOT Tucker Casey (hard rule)
- Admin auto-granted via `ADMIN_USER_EMAILS` in `server/routes.ts`

## Design rules (do not drift)

From `client/src/index.css`:

- Background: `#0a0a0a` / `#050505`
- Neon: `--neon-yellow #CCFF00`, `--neon-cyan #00FFFF`, `--neon-magenta #FF00CC`, `--neon-orange #FF6600`, `--neon-red #FF2400`
- Fonts: Barlow Condensed 900 (display), Inter (body)
- Style: urban Portland, black, neon, street poster — no pastels, no corporate rainbow-washing
- Hash routing only (`wouter` + `useHashLocation`)
- Never use localStorage/sessionStorage for auth

## What Claude should own

- Planning, copy, design review, PDF polish
- UAT checklists and acceptance criteria
- Spec refinement (mobile layout, content, post-launch polish)
- Reply via `CLAUDE_HANDOFF_FOR_GROK.md` or commits

## What Grok / Codex own

- Shell execution, Railway deploy, DNS, GitHub Actions
- Direct GraphQL deploy when MCP unavailable
- Browser/runtime debugging on live site
- Code implementation when user approves

## Railway access

**Remote MCP (OAuth — user deferred setup):**
```bash
claude mcp add railway --transport http https://mcp.railway.com
```

**GraphQL fallback (project token, not MCP):**
- Endpoint: `https://backboard.railway.com/graphql/v2`
- Header: `Project-Access-Token: e1875005-7e94-455a-98e4-ed6821da7495`
- Project: `13064cbe-e2d7-41cd-a028-fa957d0c9167`
- Service: `c87eff12-aee2-4af2-8fd9-7f42b67c3ba3`
- Environment: `8ab787f3-f5ee-4713-9845-bd17dd30ad08`

Auto-deploy: `.github/workflows/railway-deploy.yml` on push to `master`.

## Live status summary

| Area | Status |
|------|--------|
| `GET /api/gigs` | Fixed |
| GitHub → Railway deploy | Working via Actions |
| Mobile hero + nav dropdown | Live (`6537bee`) |
| Gift With Pride art | Live (`bdc0898`) |
| **Avatar system (Section 17)** | **Deployed live (`49227a2`)** |
| Apex `prideguidepdx.com` | Still Railway 404 |
| `data.db` / `uploads/` persistence | No Railway volume yet |

## Avatar system (Section 17 — IMPLEMENTED & DEPLOYED)

**User flow:** Dashboard → Edit Profile → choose photo → drag/zoom circle crop → optional pride ring → Save.

**Key files:**
- `shared/avatarRings.ts` — 18 ring options + chain/padlock
- `client/src/components/UserAvatar.tsx` — sitewide display
- `client/src/components/AvatarEditor.tsx` — crop canvas + ring picker
- `client/src/lib/avatarCrop.ts` — canvas crop export

**Schema:** `users.avatar_ring` (default `none`), `users.avatar_crop` (JSON), `users.photo_url`

**Sitewide:** Nav, Dashboard, event check-in bubbles (`AttendanceCluster`), Gifting poster + interests.

**Ring rules:** Colors/order non-negotiable. Rings optional. Glow matches site neon (not oversized). Circle crop required before save.

**Test on live:** `https://www.prideguidepdx.com/#/dashboard` as admin.

## Recent commits (newest first)

| Commit | Description |
|--------|-------------|
| `49227a2` | Avatar system + Claude bridge + dist refresh |
| `6537bee` | Mobile hero title + shrunk countdown row |
| `bdc0898` | Gift With Pride hero art |
| `fedf025` | Dist refresh for production |
| `3872755` | Mobile nav dropdown |
| `75d54d7` | Mobile hero image + desktop title |

## Still open

1. Apex domain `prideguidepdx.com` — Railway 404
2. UAT P1: ticket links (events 41, 53), mobile overflow ~390px, admin moderation cleanup (IDs 1–2)
3. `data.db` / `uploads/` Railway volume persistence
4. Browser UAT on live: claim routes, soft-launch popup, feedback form
5. Railway MCP OAuth for Claude (user deferred)
6. `GROK_HANDOFF_FOR_CODEX.md` — still stale at `c7b71db`; refresh when Codex resumes

## Deploy note

`dist/public/` is tracked in git. After CSS/frontend changes:
```bash
npm run build
git add dist/
git commit && git push origin master
```

## Images

Website images: `client/public/` → git → Railway.

Plan PDF reference assets:
- `/Users/tuckercasey/Downloads/pdx-pride-guide-plan-v8-assets/avatar-badge-reference.jpg`
- `/Users/tuckercasey/Downloads/pdx-pride-guide-plan-v8-assets/neon-ring-reference.jpg`

## User workflow preferences

- Confirm before code edits (unless user explicitly says implement/deploy)
- Deploy when user says **yes** after local changes
- Yes/no answers when asked capability questions
- Do not delete `client/public/` assets without updating code

---

*Updated by Grok — 2026-06-22. HEAD `49227a2` deployed live.*