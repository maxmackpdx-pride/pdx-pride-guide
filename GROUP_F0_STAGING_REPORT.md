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

Staging `railway.json` omits the platform healthcheck so a slow first boot on an empty volume is not killed at 60s. Restore the production healthcheck fields before fast-forwarding `staging` to `master`.
