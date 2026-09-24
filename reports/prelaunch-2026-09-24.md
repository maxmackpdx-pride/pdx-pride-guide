# ZayList prelaunch verification

The original local commit b9cbaaf was unavailable when the workspace changed between testing and the push request. Its recorded fixes and tests were restored onto origin/master 292ff4bc, preserving the newer Haüz and Mizzed follow work. All checks below were rerun on the restored release.

## Changes

- Removed the expired July Giftz posting cutoff. GIFTING_KEEP_OPEN=false retains an explicit operational pause.
- Reject blank Gigz, Giftz and Sellz listings, including blank edits. Sellz create and edit share content validation.
- Dismiss Outzide's host loading overlay when its catalogue is usable, even when WebGL initialization fails. Catalogue errors remain visible.
- Preserve nested keyboard controls in event, Giftz and Gigz cards; name event cards accessibly.
- Mark Gigz, Giftz and Sellz demo cards and label public profile event actions accurately.
- Avoid deferred seed writes after database closure and retry failed seeds next boot.
- Update Node 20 SQLite compatibility and the housing close-action test.

## Verification

- 299 regression tests passed, no failures or skips.
- 37 isolated API smoke checks passed: public endpoints, guest restrictions, redirects, signup/login/logout and sessions, private follows, listing CRUD and ownership, invalid content, community joins and public events.
- TypeScript typecheck, production build, deployment bundle checks, and predeploy checks passed.
- API writes used a temporary local seed copy with integration credentials excluded. No test writes were made to production.

The prior desktop live browser pass covered navigation, events filters/search/details, communities, Mapz recovery, Gigz, Giftz, Sellz, Mizzed, profile hosting and Outzide fallback. It inspected the live release before these changes. Safari/mobile, GPU map rendering, production authenticated flows, email/push delivery, uploads, load testing, and exhaustive security testing remain unverified.

## Repeat with Node 20

```bash
node --import tsx --test $(rg --files script server shared client/src -g '*.test.mjs' -g '*.test.ts')
npm run typecheck
node script/prepare-local-db.mjs
DATABASE_PATH=.local/data.db npm run predeploy
node --import tsx script/build.ts
npm run verify:deploy
node script/prelaunch-api-smoke.mjs
```
