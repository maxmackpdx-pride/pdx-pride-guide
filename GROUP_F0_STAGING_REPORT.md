# F0 staging incident record

## Current status as of 2026-09-19

The old Railway `staging` environment
(`d10b5732-c324-46bc-b557-ac2cc626d4f0`) was torn down on 2026-09-18. Its former
service, domain, and staging-only volume are no longer preview targets. Do not wake or
recreate the environment, apply leftover Railway canvas creates, or use the former URL.

The canonical remote preview is now a temporary Railway Sandbox in project
`pdx-pride-guide`. Phone testing, Safari testing, **stage this**, and demo URL requests
use that sandbox. It must have a public HTTPS URL, use no more than 2 GB, idle out after
about 15 minutes, have no volume or production DNS, and be destroyed when Tucker says
done. It is not `/hauz-map-sandbox`, a zip, or a second always-on service.

The production volume `pdx-pride-guide-volume`
(`d824af22-9a4b-4e1f-8f76-8be45f93886b`) remains mounted only on production at
`/data`. Never delete it or attach it to a sandbox.

## Historical configuration, no longer active

Before teardown, staging used a service watching the `staging` branch, the Railway URL
`https://pdx-pride-guide-staging.up.railway.app`, and staging-only volume
`pdx-pride-guide-staging-data` (`ad7ec42b-7d98-46b2-a5cb-e9a12f253a1b`) at `/data`.
These details are retained only to explain the incident below and must not be used as a
recreation recipe.

## Boot failure (resolved)

`dist/` was never missing. Production uses the same Nixpacks V3 `COPY . /app` after build; Docker COPY merges and does not delete `dist/`. Diagnostic start printed `STAGING_BOOT cwd=/app` and `index.cjs` at 2.4mb, then:

`SqliteError: no such column: "donate_url"`

Empty volume created `businesses` without `donate_url`. Drizzle seed inserted that column before the ALTER. Production already had the column. Fix: ALTER businesses columns immediately after CREATE TABLE. `railway.json` restored to production values (`npm start`, healthcheck 60s).

The former staging deployment reached `/api/health` 200 at SHA `04278c44` before the
environment was torn down.
