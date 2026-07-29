# Share cards live spot-check — 2026-07-28

**Prod:** https://www.zaylist.com  
**Health:** `GET /api/health` OK (`ok: true`)  
**Source map:** `shared/shareCards.ts` → `client/public/og/*`  
**SSR inject:** `server/seo.ts` (`shareCardKeyForPath` + dynamic `/api/og/*`)

Method: HTTP fetch of static `/og/*` assets (image/png bytes), Meta Open Graph via microlink on board routes, direct PNG download for dynamic OG endpoints. Document titles cross-checked against SSR document title on key paths.

---

## 1. Static OG assets (`SHARE_CARD_FILES`)

All files under `/og/` resolved **200** with **`image/png`**, 1200×630.

| Key | File | Live URL | Status | Type | Size (approx) |
|-----|------|----------|--------|------|---------------|
| `home` | `zaylist-home-fallback-1200x630.png` | `/og/…?v1` | 200 | image/png | 1.17 MB |
| `events` / `schedule` | `zaylist-events-1200x630.png` | `/og/…?v1` | 200 | image/png | 1.50 MB |
| `housing` | `zaylist-housing-1200x630.png` | `/og/…?v1` | 200 | image/png | 1.25 MB |
| `spotted` | `zaylist-missed-connections-1200x630.png` | `/og/…?v1` | 200 | image/png | 378 KB |
| `prideWork` | `zaylist-gig-board-1200x630.png` | `/og/…?v1` | 200 | image/png | 382 KB |
| `gifting` | `zaylist-gifting-1200x630.png` | `/og/…?v1` | 200 | image/png | 477 KB |

Cache-bust query is `?v1` (bust string `v1` from `shareCardUrl`, not `?v=1`). Assets still load correctly.

Repo `client/public/og/` matches the six filenames above. No missing housing or board art files.

---

## 2. Board / site pages — SSR social meta (og:image + title)

`og:image` and `twitter:image` are the same URL (set together in `applySocialMeta`).

| Path | og:title (live / microlink) | og:image | Expected card key | Match |
|------|-----------------------------|----------|-------------------|-------|
| `/` | Zaylist home title | `/og/zaylist-home-fallback-1200x630.png?v1` | `home` | OK |
| `/events` | Events board title | `/og/zaylist-events-1200x630.png?v1` | `events` | OK |
| `/schedule` | Schedule title | `/og/zaylist-events-1200x630.png?v1` | `schedule` (same file as events) | OK |
| `/hausing` | HAÜSING · Housing board | `/og/zaylist-housing-1200x630.png?v1` | `housing` | OK |
| `/gifting` | Gifting board title | `/og/zaylist-gifting-1200x630.png?v1` | `gifting` | OK |
| `/pride-work` | Gig board title | `/og/zaylist-gig-board-1200x630.png?v1` | `prideWork` | OK |
| `/spotted` | Missed Connections \| Zaylist | `/og/zaylist-missed-connections-1200x630.png?v1` | `spotted` | OK |
| `/directory` | Directory title | `/og/zaylist-home-fallback-1200x630.png?v1` | **none** → home fallback | OK (by design) |

### Path → card wiring (`shareCardKeyForPath`)

| Path pattern | Key | Notes |
|--------------|-----|--------|
| `/` | `home` | OK |
| `/events` only | `events` | Per-event `/events/:id` returns `null` → dynamic OG |
| `/schedule` | `schedule` | Reuses events PNG (intentional) |
| `/hausing`, `/hausing/*` | `housing` | Hausing spelling correct |
| `/spotted` | `spotted` | OK |
| `/pride-work`, `/gigs` | `prideWork` | OK |
| `/gifting` | `gifting` | OK |
| `/directory` | `null` | Falls through to `defaultShareCardUrl()` (home) |

**No wrong-board card swaps** (e.g. housing did not pull events/gifting art).

---

## 3. Dynamic event OG

- First live event from `GET /api/events`: **id 109** — *Jock Mondays! at Hawks*
- `GET /api/og/event/109` → **200**, **`image/png`**, 1200×630 (~769 KB)
- SSR document title for `/events/109`: `Jock Mondays! at Hawks | Portland Queer Events | Zaylist` (entity-specific)
- Code path: `pageImage = ${SITE_URL}/api/og/event/${id}` when event is LIVE

---

## 4. Dynamic place OG

- Sample place: **id 1** — *CC Slaughters*
- `GET /api/og/place/1` → **200**, **`image/png`**, 1200×630 (~210 KB)
- SSR document title for `/directory/1/cc-slaughters`: `CC Slaughters | Queer Portland Directory | Zaylist`
- Code path: `pageImage = ${SITE_URL}/api/og/place/${id}` when place is active

---

## 5. Mismatches / notes (no simple wiring fix applied)

| Item | Severity | Detail |
|------|----------|--------|
| **Directory has no dedicated share art** | Note | `/directory` correctly falls back to **home** card. There is no `directory` key or PNG in `SHARE_CARD_FILES`. Not a path bug; needs art + map entry if a board-specific card is desired. |
| **Schedule shares events art** | Intentional | `schedule` key points at the same file as `events`. |
| **Title copy drift (client vs SSR)** | Low | Some client `usePageSeo` titles differ from `ROUTE_SEO` (e.g. client Directory list uses “Portland Directory”, SSR uses “Queer Portland Directory”). Does not break card image wiring. Headless JS scrapers may see client titles after hydrate. |
| **Cache bust** | Note | URLs use `?v1` not `?v=1`. Fine for browsers/crawlers; bump `bust` in `shareCardUrl()` when replacing art. |

### Wiring bugs

**None found.** All board paths in the checklist that have cards are mapped correctly in `shareCardKeyForPath`. Housing is present and live. No code change shipped for this spot-check.

---

## Verdict

**PASS** for share-card deploy smoke:

1. All static board PNGs serve as `image/png`.
2. Board routes emit the correct card files (housing, gifting, gig, MC, events/schedule, home).
3. Dynamic event and place OG endpoints return branded 1200×630 PNGs.
4. Directory board intentionally uses home fallback until dedicated art exists.

---

*Generated 2026-07-28 (probe window ~2026-07-29 UTC) against production Railway (`railway-hikari`).*
