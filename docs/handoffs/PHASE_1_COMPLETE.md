# Phase 1 Handoff — PWA Shell + Prerequisites

## Meta

| Field | Value |
|-------|-------|
| Phase | 1 |
| Agent | `/pdx-push-phase-1` |
| Completed | 2026-07-02 |
| Build | `npm run build` ✅ |

## Summary

Zaylist is now an installable PWA. Manifest, icons, service worker (`sw.js`), iOS meta tags, standalone detection, Dashboard install banner, and `HOST_UPDATE` inbox badge fix are shipped.

## Shipped

- [x] `vite-plugin-pwa` injectManifest → `dist/public/sw.js`
- [x] `client/public/manifest.webmanifest`
- [x] Icons in `client/public/icons/`
- [x] `client/src/sw.ts` — network-first navigation + push handler stub
- [x] `client/src/lib/pwa.ts`
- [x] `PwaInstallBanner` on Dashboard
- [x] `HOST_UPDATE` badge fix in `inboxContext.ts`

## For Phase 2

- Extend push handlers in `client/src/sw.ts` (already has declarative + imperative)
- Register via `/sw.js` — `registerServiceWorker()` in `main.tsx` (prod only)
- Notification icon: `/icons/icon-192.png`
- iOS: use `isStandalonePwa()` before permission prompts