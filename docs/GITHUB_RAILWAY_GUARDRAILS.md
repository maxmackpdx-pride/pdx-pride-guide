# Deployment Guardrails (GitHub + Railway Only)

## Source of truth
- Codebase and production work happen in this checkout of:
  - `maxmackpdx-pride/pdx-pride-guide` (any local path; resolve as `$ZAYLIST_REPO`)
- Live deployment target:
  - GitHub `master` on `maxmackpdx-pride/pdx-pride-guide`
  - Railway project `pdx-pride-guide` (`13064cbe-e2d7-41cd-a028-fa957d0c9167`)
  - Environment `production` (`8ab787f3-f5ee-4713-9845-bd17dd30ad08`)
  - Service `pdx-pride-guide` (`c87eff12-aee2-4af2-8fd9-7f42b67c3ba3`)
  - Volume `pdx-pride-guide-volume` (`d824af22-9a4b-4e1f-8f76-8be45f93886b`) at `/data`

## Mandatory release rule
- No site changes are production edits unless they land on this repo’s `origin/master`.
- Do not treat edits in alternate clones, worktrees, or side folders as deploy-ready by themselves.

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

Never deploy production with `railway up` or `railway sandbox`. The only normal ship
path is `git push origin master` -> GitHub Actions -> Railway. Keep `domain-redirects`
and `domain-redirects-apex` in place.

## Current production facts (2026-09-19)

- Live deploy `5c6ce1c5-75f8-407c-aea8-29922737ce46` is `SUCCESS`.
- Health is OK with git SHA `46597a947d60321bb3e8991fe53c8b7ba818f99f`.
- RAM use is about 0.71 GB. Railway still reports an 8 GB limit; a 1.5 GB replica-cap
  attempt did not stick, so do not keep retrying caps that do not apply.
- Env controls: `FLYER_LLM_DISABLED=1`, `QSEARCH_SCRUB_LLM=0`, and
  `QSEARCH_SCRUB_FLYER_VISION=0`.

## Staging and sandboxes

- Staging environment `d10b5732-c324-46bc-b557-ac2cc626d4f0` was torn down on
  2026-09-18 and had zero live services as of 2026-09-19.
- Do not recreate staging as always-on, apply leftover canvas creates, or attach the
  production `/data` volume.
- Create a Railway Sandbox only when Tucker explicitly says **demo** or **sandbox**.
- Never point `zaylist.com` or `prideguidepdx.com` at a sandbox. Use a short idle timeout
  and destroy it when done.
- Sandbox VMs cost about `$50/GB-month` while they exist.
- Keep Mapz color and shader work off `master`.

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
