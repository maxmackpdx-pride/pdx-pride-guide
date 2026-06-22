# PDX Pride Guide — Soft Launch UAT Report

Date: June 22, 2026
Tester: Codex production pass
Live site: https://www.prideguidepdx.com
Repo head tested locally/pushed: 638106b
Live bundle during test: assets/index-WvdW41JC.js, assets/index-dQITpYT1.css

## Ship Recommendation

NO-SHIP for wide promotion yet.

The core event browse path works, but production is stale versus GitHub and still has a broken Pride Work API. The claim-event 404 is fixed in repo but not live until Railway deploys the latest commit.

## P0 / Blockers

| Area | Result | Impact |
| --- | --- | --- |
| Production deploy drift | Live bundle does not include commits e56d429, ce8ad4d, or 638106b | Claim route, gigs DB migration, soft-launch popup, and feedback form are not live |
| Claim an Event route | `#/submit?mode=claim&eventId=20` and `#/submit/claim/20` both show React 404 on live | Users trying to claim Treasure Trail / Bearracuda hit the 404 |
| Pride Work API | `GET /api/gigs` returns 500: missing `post_type` column | Pride Work cannot load real listings |
| Pride Work UI masking | Page shows “0 posts / no posts yet” instead of surfacing the API failure | Testers/admin may think the board is empty rather than broken |
| Apex API | `https://prideguidepdx.com/api/events?limit=1` returns homepage HTML after redirect | API only works correctly on `www` while apex is still Squarespace-controlled |

## P1 / Before Wider Share

| Area | Result | Impact |
| --- | --- | --- |
| Ticket links | Event 41 Portland Trans Pride March and event 53 Dyke March use generic `https://portlandpride.org` | Needs event-specific links if available |
| Mobile layout | Home at 390px viewport has slight horizontal overflow: scrollWidth 387 vs clientWidth 384 | Small but real mobile polish issue |
| Admin moderation | Two test REMOVE requests are pending in admin | Clean up in admin queue |
| Feedback form | Implemented in repo, not live | Needs deployment before asking testers to submit feedback |

## What Works Live

- `GET https://www.prideguidepdx.com/api/events?limit=1` returns JSON.
- Events API returns 44 events.
- Events page renders 44 cards and a Leaflet map.
- Expanded events map has `BACK TO EVENTS` and `COLLAPSE`.
- `GET /api/events/unclaimed` works; Treasure Trail and both Bearracuda events are unclaimed/claimable.
- `GET /api/events/20/attendance` returns attendance data.
- Google OAuth redirects with the corrected client ID and www callback.
- Admin login works with server credentials.
- Account creation has repeat password field and mismatch validation.
- Gifting page loads and `GET /api/gifting` returns JSON.
- Missed Connections correctly gates logged-out users.

## Expected 401s

The following return 401 when logged out, which matches the current account-required product direction:

- `POST /api/submit`
- `POST /api/gigs`
- `POST /api/events/:id/attendance`

These are not launch blockers unless the product decision changes back to public posting/check-ins.

## Repo Fixes Already Pushed

- e56d429: repaired claim route with `#/submit/claim/:eventId` and legacy query redirect.
- ce8ad4d: added startup migration for `gig_posts.post_type`.
- 638106b: added soft-launch welcome popup, footer tech feedback form, feedback API/table, admin feedback tab, and removed stale client admin password.

## 48-Hour Plan

1. Redeploy Railway from GitHub commit `638106b`; verify live bundle changes.
2. Confirm `GET /api/gigs` returns JSON after the migration runs.
3. Re-test claim flow for Treasure Trail and Bearracuda from event modal to claim form.
4. Verify soft-launch popup and footer tech feedback form are live.
5. Move apex/root domain off Squarespace or configure apex API behavior so `/api/*` on non-www never returns SPA HTML.
6. Replace generic ticket links for Trans Pride March and Dyke March if official event-specific links exist.
7. Clean up moderation test requests IDs 1 and 2.
8. Re-run desktop and mobile browser UAT after deploy.
