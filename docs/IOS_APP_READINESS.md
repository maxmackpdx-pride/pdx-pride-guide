# Zaylist iOS readiness

The installed web app and the website remain the active products. A future native app can share their account data, content, web URLs, and notification decisions.

## Contracts already available

- `/api/v1` exposes typed, visibility-filtered reads. `/api/v1/openapi.json` describes the current contract.
- `GET` and `PUT /api/v1/me/notification-preferences` use the existing session and preference storage. The website retains its proven `/api/users/me/notification-prefs` routes until the new endpoint is smoke tested with an authenticated account.
- `messageNotificationIntent` chooses the title, body, badge and Zaylist destination before Web Push formats the payload. A future APNs sender can format this intent for native delivery without maintaining another set of message destinations.
- Destinations are first-party relative paths. Today they resolve to `www.zaylist.com`; a native app can later claim the same URLs with an associated domain. Do not publish an association file until the Apple Team ID, bundle ID and supported paths are set.

## Next migration slices

1. Move one authenticated action at a time to `/api/v1`, sharing the existing permission checks and storage path. Keep older routes while the website migrates. Add contract tests for success, unauthenticated, forbidden and invalid input.
2. Decide the native sign-in flow before shipping an app. Current same-origin, cookie-backed Google sign-in works for the website, but a native client needs a tested external-browser return and session model.
3. Register native APNs tokens separately from Web Push subscriptions. Dispatch the same notification intent to each registered channel, honor the same preferences, and remove invalid tokens. A web subscription is not a native APNs token.
4. Add the `apple-app-site-association` file and Associated Domains entitlement once the bundle ID exists, then test links from Messages, Mail and notifications on a physical iPhone.

## iPhone acceptance pass

On a physical iPhone, check Safari and an installed Home Screen copy: open a shared event/place/profile URL; sign in and return to the requested page; open Mapz, grant or deny location, and navigate between Mapz and Outzide; change notification settings; enable push from the installed copy, receive a message and tap its notification; background and reopen the app. Check signed-out and weak-network states. Record device/iOS version and failures before extending the native contract.

Current automated coverage checks the v1 preference schema, destination safety and parity between message intent and Web Push. It does not replace the physical device pass.
