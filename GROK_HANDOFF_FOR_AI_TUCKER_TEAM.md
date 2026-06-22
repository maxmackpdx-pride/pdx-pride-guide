# Handoff For AI Tucker Team — 2026-06-22 (from Grok)

**AI Tucker Team** = Grok + Codex + Claude (+ Tucker). Read this file first when joining the PDX Pride Guide project.

GitHub is the communication bus. There is no live API tunnel between agents.

## How this bridge works

| Direction | File | Writer | Reader |
|-----------|------|--------|--------|
| Grok → AI Tucker Team | `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` | Grok | Codex, Claude, all |
| AI Tucker Team → Grok | `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` | Codex, Claude, any | Grok |

Legacy aliases (redirect here):
- `GROK_HANDOFF_FOR_CODEX.md`
- `GROK_HANDOFF_FOR_CLAUDE.md`
- `CODEX_HANDOFF_FOR_GROK.md`
- `CLAUDE_HANDOFF_FOR_GROK.md`

**Team start prompt:**
> Read `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` and `SOFT_LAUNCH_UAT_REPORT_CODEX.md` in `maxmackpdx-pride/pdx-pride-guide` on `master`. Reply in `AI_TUCKER_TEAM_HANDOFF_FOR_GROK.md` or via commits.

## Executive summary

| Item | Status |
| --- | --- |
| **GitHub HEAD** | `11e31ac` (docs); feature HEAD `49227a2` |
| Live site | `https://www.prideguidepdx.com` — `index-CSxnRzuH.css`, `index-D7i_j5zy.js` |
| `GET /api/gigs` on www | **FIXED** — returns `[]` (zero LIVE posts in DB; expected) |
| Production deploy drift | **FIXED** — GitHub Actions on `master` |
| Pride Work UI error masking | **FIXED** |
| Avatar system (Section 17) | **DEPLOYED** — circle crop + optional pride rings |
| Mobile hero + nav | **DEPLOYED** |
| Gift With Pride art | **DEPLOYED** |
| Apex `prideguidepdx.com` | **STILL BROKEN** — Railway 404 |
| UAT P1 items | **NOT STARTED** (ticket links, mobile overflow, admin cleanup) |
| Claim route / popup / feedback | Deployed — needs browser re-UAT |

## Project paths

| Item | Value |
|------|-------|
| Canonical repo | `/Users/tuckercasey/Documents/Codex/2026-06-20/c/work/pdx-pride-guide` |
| GitHub | `maxmackpdx-pride/pdx-pride-guide` (branch `master`) |
| Plan PDF | `/Users/tuckercasey/Downloads/pdx-pride-guide-plan-v8.pdf` |
| UAT report | `SOFT_LAUNCH_UAT_REPORT_CODEX.md` |

## Admin & identity

- **Owner/admin Google login:** `hello.tuckercasey@gmail.com`
- **Display username:** `tucker_pdmax`
- **Creator credit everywhere:** Tucker Max — NOT Tucker Casey (hard rule)
- Admin via `ADMIN_USER_EMAILS` in `server/routes.ts`

## Design rules (do not drift)

- Background: `#0a0a0a` / `#050505`
- Neon: `#CCFF00`, `#00FFFF`, `#FF00CC`, `#FF6600`, `#FF2400`
- Fonts: Barlow Condensed 900 (display), Inter (body)
- Hash routing only; never localStorage/sessionStorage for auth

## Team roles

| Agent | Owns |
|-------|------|
| **Codex** | UAT, browser testing, ticket links, mobile overflow, admin cleanup, deploy verification |
| **Claude** | Planning, copy, design review, PDF polish, spec refinement |
| **Grok** | Shell, Railway deploy, DNS, GitHub Actions, implementation when Tucker approves |

## What changed since early handoff (`c7b71db`)

| Commit | Description |
|--------|-------------|
| `49227a2` | Avatar system: `UserAvatar`, `AvatarEditor`, pride rings |
| `6537bee` | Mobile hero title + countdown row |
| `bdc0898` | Gift With Pride hero art |
| `3872755` | Mobile nav MENU dropdown |
| `11e31ac` | AI Tucker Team bridge docs |

### Avatar system (UAT)

- Dashboard → Edit Profile → crop → optional ring → save
- Files: `UserAvatar.tsx`, `AvatarEditor.tsx`, `shared/avatarRings.ts`
- Test live: `https://www.prideguidepdx.com/#/dashboard`

## Deploy

GitHub Actions: `.github/workflows/railway-deploy.yml` on push to `master`.

`dist/public/` is tracked — run `npm run build` and commit `dist/` after frontend changes.

## Verification

```bash
curl -sS "https://www.prideguidepdx.com/api/events?limit=1"
curl -sS "https://www.prideguidepdx.com/api/gigs"
curl -sS "https://www.prideguidepdx.com/" | grep -oE 'index-[^"]+\.(css|js)' | head -2
```

## Browser UAT checklist

- [ ] Claim routes for event 20
- [ ] Soft-launch popup (once)
- [ ] Footer feedback form
- [ ] Pride Work error UI / live posts
- [ ] Avatar crop + ring on Dashboard; visible in nav + gifting
- [ ] Mobile home ~390px overflow
- [ ] Admin moderation cleanup IDs 1–2
- [ ] Ticket links events 41 and 53

## Still open

1. Apex domain `prideguidepdx.com`
2. UAT P1 items above
3. `data.db` / `uploads/` Railway volume
4. Railway MCP OAuth (Tucker deferred)

## Railway reference

| Key | Value |
| --- | --- |
| Project ID | `13064cbe-e2d7-41cd-a028-fa957d0c9167` |
| Service ID | `c87eff12-aee2-4af2-8fd9-7f42b67c3ba3` |
| Environment ID | `8ab787f3-f5ee-4713-9845-bd17dd30ad08` |
| Project token | `e1875005-7e94-455a-98e4-ed6821da7495` |

## User workflow preferences

- Confirm before code edits unless Tucker says implement/deploy
- Deploy when Tucker says **yes**
- Creator credit: Tucker Max — NOT Tucker Casey

---

*Handoff For AI Tucker Team — updated by Grok 2026-06-22. HEAD `11e31ac`.*