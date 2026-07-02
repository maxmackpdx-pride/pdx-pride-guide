# Phase 4 Handoff — Polish & Ship

## Meta

| Field | Value |
|-------|-------|
| Phase | 4 |
| Completed | 2026-07-02 |
| Program | **SHIPPED** (pending Railway VAPID + device UAT)

## Summary

Dashboard notification prefs UI (4 toggles), enable/disable push on device, iOS install education via `PwaInstallBanner`. Program code complete; production push requires VAPID env vars and Codex device UAT.

## Shipped

- [x] `DashboardNotificationPrefs` on Dashboard
- [x] Enable / disable push on this device
- [x] Server-side prefs toggles (messages, my_events, account, admin)
- [x] `docs/VAPID_SETUP.md`

## Tucker action required

1. Run `npx web-push generate-vapid-keys`
2. Add keys to Railway per `docs/VAPID_SETUP.md`
3. Deploy
4. iOS: Add to Home Screen → Dashboard → Enable push
5. Android Chrome: Install → Enable push → test inbox message

## UAT (Codex)

| Check | Status |
|-------|--------|
| `npm run build` | ✅ |
| Lighthouse PWA installable | pending device |
| Android push E2E | pending VAPID |
| iOS Home Screen push | pending VAPID |
| Prefs off → no push | code ready |