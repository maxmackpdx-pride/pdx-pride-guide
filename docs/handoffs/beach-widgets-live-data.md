# Handoff: Nude Beaches live-condition widgets not populating

**For:** Grok · **From:** Claude (website-management branch)
**Status:** client-side symptom mitigated + committed; the root cause is server↔external-API and needs production logs.

## Symptom
On `/nude-beaches`, the Rooster Rock and Sauvie Island condition widgets (river
level, air/water temp, wind, air quality, swim status) show dashes / blanks and
the timestamp gets stuck (owner saw it frozen at "Jul 11 12:45 AM · refreshing
in background"). Owner reported it as "the widgets stopped refreshing."

## What is NOT the cause
- **Not the map pins.** The trail markers (`shared/nudeBeaches.ts` `BEACH_POIS`,
  `client/src/components/NudeBeachesMap.tsx`) are static client data and never
  touch the condition fetch path.
- **Not a missing User-Agent.** `fetchText` in `server/nudeBeaches.ts:57` already
  sends `User-Agent: PDX-Pride-Guide/1.0 (+https://www.prideguidepdx.com)`.
- **Not a broken code path.** `GET /api/nude-beaches` returns the correct shape;
  the values are null because the upstream fetches error out.

## What I already shipped (client mitigation)
`client/src/pages/NudeBeaches.tsx` — the query fetched once and never re-checked,
so a completed background refresh only showed on manual reload. It now polls
every 20s while the snapshot is `stale` and refetches on window focus, stopping
once current. This fixes the "frozen / refreshing forever" feel but cannot
invent data the upstream APIs refuse to return.

## The real bug (server ↔ external APIs) — needs production
When the server refreshes a snapshot it calls, in parallel:

- `server/nudeBeaches.ts` → `fetchRoosterRockLive()` (~L366): `fetchUsgsRiverLevel`,
  `fetchNwsSummary`, `fetchUsgsWaterTemp`, `fetchOpenMeteoAirQuality`,
  `fetchOpenMeteoCurrent`.
- `fetchSauvieIslandLive()` (~L430): `fetchSwimGuideCollins`, `fetchParkingNote`,
  `fetchNwsSummary`.

Hosts: `api.weather.gov` (NWS), `waterservices.usgs.gov` (USGS),
`api.open-meteo.com`, `www.theswimguide.org`, `sauvieislandparking.com`.

Both beaches currently come back with an `error` field set (I saw `HTTP 403` in
my sandbox, **but that is my egress proxy blocking those hosts — not a valid
production signal**; I cannot reach these APIs from my environment, which is why
this needs you on the live server).

### Key nuance for whoever debugs this
`stale` (in `getNudeBeachesSnapshot`, L474) is **cache-age only** (`CACHE_TTL_MS`
= 30 min), *not* data quality. A failed refresh still calls `writeCache` with a
fresh `fetchedAt` + null values + `error`, so after one failed cycle `stale`
flips to `false`, the "refreshing in background" text disappears, and the widget
just shows blanks with a recent timestamp. So "not stale" ≠ "healthy."

Also note: `data.db` is committed and carries a baked-in snapshot
(`nude_beach_cache`, `fetched_at = 2026-07-11T00:45:15Z`). If Railway resets the
DB to the committed copy on deploy, every deploy reverts the beach cache to that
stale snapshot until a successful refresh runs.

## What to check on production
1. Railway logs around a beach load / `POST /api/nude-beaches/refresh` — grep for
   `Background nude beaches refresh failed` (L489) and the per-beach `error`
   string. Get the **actual** status/message per host.
2. Most likely one of: NWS/USGS rate-limiting or IP-blocking the Railway egress
   (429/403), a TLS/DNS failure to a host, or a response-shape change breaking
   `JSON.parse` in `fetchJson` (L75).
3. Confirm whether prod's `data.db` persists across deploys or resets to the
   committed copy (explains the stuck timestamp).

## Suggested fixes (pick per what the logs show)
- Per-source retry with small backoff, and **don't overwrite good cached values
  with nulls** on a failed refresh (merge: keep last-known value when a source
  errors, only replace on success). This alone would stop the "goes blank after a
  deploy" behavior.
- If a specific host blocks the datacenter IP, add a fallback source or a cached
  proxy.
- Surface a small visible "live conditions temporarily unavailable" state on the
  widget when `error` is set (instead of silent dashes) — owner already OK'd this
  idea; I left it for whoever fixes the fetch so the copy matches the real cause.
- Consider a scheduled server-side refresh (there's a scheduler pattern in
  `server/scheduler.ts`) so the cache warms without depending on a visitor.

## Files
- `server/nudeBeaches.ts` — all fetch/cache logic (the fix lives here).
- `client/src/pages/NudeBeaches.tsx` — client query (already polls while stale).
- `shared/nudeBeaches.ts` — types + static data (no change needed).
