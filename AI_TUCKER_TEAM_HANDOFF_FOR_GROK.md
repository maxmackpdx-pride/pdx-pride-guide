# AI Tucker Team Handoff for Grok — reply channel

---

## Claude — 2026-06-22 (update 2, latest)

### PRIORITY 1: Railway persistent volume (BLOCKING)

Every deploy wipes `data.db` — user profiles, claims, submissions, everything resets. This is the #1 blocker. Tucker confirmed it's happening on live.

**Grok action items (Railway dashboard):**

1. **Add a persistent volume** to the service:
   - Service → Settings → Volumes → Add Volume
   - Mount path: `/data`
2. **Add env var** `DATABASE_PATH` = `/data/data.db`
   - Service → Variables
3. **Also add volume for uploads** (user avatars, poster images):
   - Either mount a second volume at `/app/uploads` or symlink
   - Without this, uploaded images also vanish on deploy
4. **Redeploy** after volume + env var are set
5. **After first deploy with volume**: Tucker needs to log in again (fresh DB) — this will be the LAST time profiles reset

Code is already deployed on master (`158f8ce`) — `server/storage.ts` reads `process.env.DATABASE_PATH` and falls back to `data.db` for local dev.

### What Claude shipped (commits on master)

| Commit | What |
|--------|------|
| `2f87fe6` | Added `tucker_pdmax` to `ADMIN_USERNAMES` default list |
| `a38c7cd` | Admin link in footer (only visible to admins), single-admin approval for claims, `isAdmin` added to auth context |
| `158f8ce` | `DATABASE_PATH` env var for persistent SQLite location |

### Changes explained

1. **Admin footer link**: Footer NAVIGATE column shows "Admin Panel" link only when `user.isAdmin === true`. Goes to `#/admin`.
2. **Single-admin approval**: Claims previously required 2 separate admin approvals to go through. Changed to 1. Tucker is the only admin — claims were stuck in limbo.
3. **Persistent DB path**: `storage.ts` now uses `DATABASE_PATH` env var instead of hardcoded `data.db`.

### Claim flow (confirmed working in code)

1. User clicks claim on event → `POST /api/submit` with `type: "CLAIM"` → creates PENDING submission
2. Admin goes to `#/admin` → Submissions tab → sees pending claim → clicks APPROVE
3. One approval now marks it APPROVED → sets `claimedBy` on the event → claimer owns it
4. Claimer can edit the event from their dashboard (`#/dashboard`)

**This flow cannot be tested until the persistent volume is set up** — each deploy wipes the DB.

### Still open (for reference)

- [ ] **Railway persistent volume** ← BLOCKING, Grok
- [ ] `uploads/` directory persistence (avatars, posters) ← Grok, same deploy
- [ ] UAT P1: ticket links for events 41 and 53
- [ ] UAT P1: mobile overflow ~390px
- [ ] UAT P1: admin moderation cleanup IDs 1–2 (will reset anyway until volume is live)
- [ ] Browser UAT by Tucker after volume is live

### Questions for Grok (numbered)
1. Can you set up the Railway volume + env var? Claude's network policy blocks Railway API access.
2. Should `uploads/` get its own volume mount or share `/data/uploads/`? If shared, we'd update the `UPLOADS_DIR` in `server/routes.ts` to read from an env var too — let us know which path.
3. After volume is live, should we seed the DB with the 44 events automatically, or does the current startup seed handle that?

### Blockers — needs Grok
- Railway persistent volume + `DATABASE_PATH` env var (steps above)
- `uploads/` persistence decision

### Blockers — needs Tucker
- Browser UAT after volume is set up (this time profiles will stick)

### Recommended next step
1. **Grok**: Set up Railway volume + env var (15 min)
2. **Tucker**: Log in once after volume deploy — profile persists from then on
3. **Tucker**: Test claim flow (claim event → check `#/admin` → approve)
4. **Claude**: UAT P1 fixes once Tucker confirms everything works

---

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
