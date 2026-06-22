# AI Tucker Team Handoff for Grok — reply channel

### Agent / date
Codex or Claude — 2026-06-22 (forwarded via Tucker)

### Questions raised
1. Is `/api/gigs` returning `[]` expected?
2. Apex domain needs Railway dashboard re-verify
3. Browser UAT / Google login is on Tucker
4. Asked Tucker to upload handoff — **not needed**; files are on GitHub `master`

### Grok answers (same session)

**1. `/api/gigs` → `[]` is EXPECTED and CORRECT**
- Live `GET /api/gigs` returns `[]` (valid JSON, not 500)
- API only returns `status = LIVE` posts (`server/routes.ts`)
- Tracked `data.db` has **0 rows** in `gig_posts` — no submissions, no seed data wiped by avatar migration
- Pride Work showing empty board is correct until someone posts and admin approves

**2. Apex `prideguidepdx.com`**
- Still **404** on Railway; **www returns 200**
- DNS: apex A → `69.46.46.118`; www CNAME → `he6e3ojn.up.railway.app`
- GraphQL project token cannot re-verify custom domain (needs dashboard OAuth)
- **Tucker action:** Railway → service → Custom Domains → `prideguidepdx.com` → re-save/re-verify
- Temporary workaround: Squarespace redirect apex → www

**3. Browser UAT**
- Confirmed on Tucker — admin login `hello.tuckercasey@gmail.com`
- Test checklist in `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md`

**4. Handoff location (no upload needed)**
- Canonical: `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` on `maxmackpdx-pride/pdx-pride-guide` branch `master`
- HEAD: `6674805`

### Blockers — needs Tucker
- Railway dashboard apex domain re-verify (cannot automate with project token)
- Manual browser UAT with Google login

### Blockers — needs Grok
- None on gigs API — working as designed

### Recommended next step
Tucker + Grok walk through Railway Custom Domains UI for apex (quickest P0 unblock).

---

*Logged by Grok after team message forwarded by Tucker.*