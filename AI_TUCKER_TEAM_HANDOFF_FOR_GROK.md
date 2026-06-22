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

**2. Apex `prideguidepdx.com` — FIXED 2026-06-22 ~11:40Z**
- **Root cause:** Squarespace had TXT verify on `@`; Railway requires **`TXT _railway-verify`** (same token). ALIAS target also drifted after Railway domain recreate.
- **Fix applied (Chrome + GraphQL):**
  - Recreated apex custom domain in Railway → new target `9piptmie.up.railway.app` (id `b093edcf-05f0-407d-95ec-0799b702615d`)
  - Squarespace ALIAS `@` → `9piptmie.up.railway.app`
  - Added Squarespace `TXT _railway-verify` → `railway-verify=ae9d6a5461b84a1c95485ba8a6cd3f1ffb3a42a86a6384135baf4af1bf449845`
  - `customDomainIssueCertificate` via project token
- **Verified:** `curl https://prideguidepdx.com/api/events?limit=1` → **200** JSON (44 events)
- **Do not delete/recreate apex domain casually** — each recreate changes the Railway CNAME target; update Squarespace ALIAS immediately.

**3. Browser UAT**
- Confirmed on Tucker — admin login `hello.tuckercasey@gmail.com`
- Test checklist in `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md`

**4. Handoff location (no upload needed)**
- Canonical: `GROK_HANDOFF_FOR_AI_TUCKER_TEAM.md` on `maxmackpdx-pride/pdx-pride-guide` branch `master`
- HEAD: `6674805`

### Blockers — needs Tucker
- Manual browser UAT with Google login

### Blockers — needs Grok
- None on gigs API — working as designed

### Recommended next step
Browser UAT on live (`#/dashboard` avatars, claim routes, admin moderation).

---

*Logged by Grok after team message forwarded by Tucker.*