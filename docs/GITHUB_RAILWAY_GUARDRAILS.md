# Deployment Guardrails (GitHub + Railway Only)

## Source of truth
- Codebase and production work happen in this repo:
  - `/Users/tuckercasey/pdx-pride-guide`
- Live deployment target:
  - GitHub `master` on `maxmackpdx-pride/pdx-pride-guide`
  - Railway production for project `zaylist` / service `pdx-pride-guide`

## Mandatory release rule
- No site changes are production edits unless they go to this path and `origin/master`.
- Do not treat edits in `Documents/Zaylist` or other clones as deploy-ready by themselves.

## Production workflow
1. Work on `master` branch in canonical repo.
2. Run:
   - `git fetch origin`
   - `git checkout master`
   - `git pull --ff-only origin master`
3. Make change(s).
4. Commit only intended production fix(es).
5. Ask explicitly before pushing.
6. Push:
   - `git push origin master`
7. Confirm:
   - GitHub Actions workflow `railway-deploy.yml` runs on `master` and finishes.
   - Railway shows deploy SUCCESS.
8. Probe endpoint:
   - `https://www.zaylist.com/api/health`

## Language rules
- Before push: say **"Fixed locally — ready to push"**.
- After push only: **"On GitHub; deploy in progress"**.
- Only after Railway SUCCESS + smoke check: **"Production updated"**.

## Hosting domains
- Primary: `https://www.zaylist.com`
- Secondary: `https://www.prideguidepdx.com`
- Keep legacy/parking domains if needed, but route production through Railway.

## Why this exists
- Keep one source of truth.
- Avoid ChatGPT Sites deploy artifacts becoming the only way to host the live site.
- Make handoffs safe for Claude/Grok/Codex and for human teammates.
