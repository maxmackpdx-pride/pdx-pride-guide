# Phase 3 Handoff - Inbox → Push Dispatch

## Meta

| Field | Value |
|-------|-------|
| Phase | 3 |
| Completed | 2026-07-02 |

## Summary

All `sendMessage()` calls now schedule push delivery. Prefs filter by category; rate limit 20/user/hour; dead tokens pruned on 410.

## Shipped

- [x] `server/push/dispatch.ts`, `templates.ts`
- [x] Hook in `storage.sendMessage()` → `schedulePushForMessage()`
- [x] Declarative payloads with deep links to `/inbox?thread=…`
- [x] Category mapping per `shared/pushCategories.ts`

## Deferred

- Admin queue push (throttled alerts) - Phase 4 optional