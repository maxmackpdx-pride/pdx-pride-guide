# F0 Staging target

Railway environment `staging` (`d10b5732-c324-46bc-b557-ac2cc626d4f0`) in project `pdx-pride-guide`.
Service `pdx-pride-guide` watches git branch `staging`.
URL: https://pdx-pride-guide-staging.up.railway.app

Own SQLite volume `pdx-pride-guide-staging-data` mounted at `/data` (id `ad7ec42b-7d98-46b2-a5cb-e9a12f253a1b`). Production volume `d824af22-9a4b-4e1f-8f76-8be45f93886b` stays on production only. Duplicate originally attached the production volume; it was detached from staging before the new volume was created.

SITE_URL / PUBLIC_SITE_URL / GOOGLE_REDIRECT_URI point at the staging Railway domain. SESSION_SECRET is unique to staging.

## Rollback

1. Stop watching the branch: set staging `source.branch` back to a no-op or delete the environment.
2. `railway environment delete staging` (or dashboard) removes the staging environment, its empty volume, and its domain. Production is untouched.
3. Delete GitHub branch `staging` if you want the git pointer gone.
4. Remove `.github/workflows/railway-staging.yml`.

Do not delete volume `d824af22-9a4b-4e1f-8f76-8be45f93886b`. That is production data.

## Boot failure (resolved)

`dist/` was never missing. Production uses the same Nixpacks V3 `COPY . /app` after build; Docker COPY merges and does not delete `dist/`. Diagnostic start printed `STAGING_BOOT cwd=/app` and `index.cjs` at 2.4mb, then:

`SqliteError: no such column: "donate_url"`

Empty volume created `businesses` without `donate_url`. Drizzle seed inserted that column before the ALTER. Production already had the column. Fix: ALTER businesses columns immediately after CREATE TABLE. `railway.json` restored to production values (`npm start`, healthcheck 60s).

Staging `/api/health` is 200. SHA `04278c44`.
