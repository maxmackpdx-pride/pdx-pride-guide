---
name: pdx-trusted-audit
description: >
  Audit Zaylist Trusted venue sources: adapters, health board, flyers vs live
  venue pages, Sports Bra schedule, Sanctuary ICS+page art, policy stamps, and
  trusted smoke tests. Triggers: "trusted audit", "audit trusted", "sanctuary
  flyers wrong", "sports bra games", "trusted sync", "/pdx-trusted-audit".
  Catch-all QSearch is out of scope (use /pdx-qsearch-audit).
---

# PDX Trusted Source Audit Agent

You audit the **Trusted** lane: custom fetch modes, venue policy, flyer attachment, and live truth against each venue’s real calendar/pages.

## Repo + docs (read first)

| Path | Why |
|------|-----|
| `docs/QSEARCH.md` (Trusted sections) | Health, flyer coverage, wave notes |
| `docs/SPORTS_BRA_AIRTABLE.md` | Airtable / game posters |
| `shared/trustedVenues.ts` | Registry, `isTrustedLaneSource`, policies |
| `server/qsearch/trustedSync.ts` | Sync → Review queue |
| `server/qsearch/trustedHealth.ts` | Health derivation + flyer coverage |
| `server/ingest/adapters/*` | sanctuary, sportsBra, eagle, darcelle, hawks |

Repo root: `/Users/tuckercasey/pdx-pride-guide`

## Trusted roster (audit every row)

| sourceId | Mode | Live truth starts here |
|----------|------|------------------------|
| `badlands-api` | badlands_api | badlandsportland.com/calendar + worker JSON |
| `sanctuary-ics` | sanctuary_ics | pdxsanctuary.com ICS + per-event pages |
| `eagle-events` | eagle_wix | eagleportland.com/what-s-happening |
| `darcelle-tribe` | darcelle_tribe | darcellexv.com events / Tribe JSON |
| `hawks-json` | hawks_squarespace | hawkspdx.com/hawks-events?format=json |
| `stag-eb` | generic | Eventbrite Stag organizer |
| `sports-bra-eb` | sports_bra_airtable | thesportsbraofficial.com/pages/portland (+ public Airtable share) |
| `living-room-eb` | generic | Eventbrite org + livingroomwinespdx.com |
| `camp-bar` | generic | campbarpdx.com |
| `cc-slaughters` | generic | ccslaughterspdx.com |

## Standing rules

1. **Custom path only.** Do not “fix” trusted by dumping them back into QSearch scan.
2. **Review queue / never invent FREE** unless listing text says free.
3. **Sanctuary / Hawks:** 21_PLUS + sex-positive stamps; never ALL_AGES.
4. **Sports Bra:** games/watch parties — not Eventbrite city “sports” noise. Prefer Airtable/public share; generated posters via `/api/game-poster` when no attachment.
5. **Confirm before push/deploy.** Never print full secrets (Airtable PAT, keys).
6. **Flyers must match the event** — logo is not a flyer; series reuse must not cross-contaminate different series.

## Audit checklist

### A. Automated smoke (always run)

```bash
cd /Users/tuckercasey/pdx-pride-guide
npx tsx script/smoke-trusted-new-venues.ts
npx tsx script/smoke-trusted-flyers.ts
npx tsx script/smoke-sports-bra.ts
```

### B. Registry + lane isolation

- All 10 venues present in `TRUSTED_VENUES`.
- `isTrustedLaneSource` true for each + siblings (`sanctuary-calendar`, `darcelle-ics`).
- Confirm QSearch catch-all would exclude them (spot-check `buildLiveSources` logic / dashboard if up).

### C. Live webpage + flyer confirmation (core of this agent)

For **each** trusted venue (or prioritized failing ones if time-boxed):

1. **Open calendar / feed URL** — list upcoming events (titles + dates).
2. **Pick 2–3 upcoming events** (or 1 if sparse).
3. **Open the event detail page** when one exists (Sanctuary event page, EB event, Tribe event, etc.).
4. **Flyer check:**
   - Download or inspect og:image / WP upload / Squarespace asset / Wix media.
   - Use `read_file` on image paths when local; otherwise curl + note URL.
   - Confirm art is **that night’s flyer**, not brand logo, not another series, not a 2025 leftover widget.
5. **Adapter expectations:**
   - **Sanctuary:** ICS has no ATTACH; flyer from matched event page or honest null — not wrong series. Logo filtered (`isSanctuaryLogoPoster`).
   - **Eagle:** Wix media not 63px fill thumbnails.
   - **Darcelle:** Tribe `image.url` full size preferred.
   - **Hawks:** `assetUrl` posters; sex-positive stamps.
   - **Sports Bra:** matchup/date/time from schedule; poster attachment or `/api/game-poster` query URL — **not** church pickleball / random EB.
6. Compare to local draft if you can run adapter fetch (network + env). Note Airtable 403 if PAT lacks base access — public share path is valid follow-up.

### D. Policy + health

- Age / sex-positive / admission per `venuePolicy` and adapter policy.
- Flyer coverage health: series-reuse should not fake “green” coverage if code counts fresh only (`countFreshFlyerDrafts` / trusted health docs).
- Sync mode lands **Review**, not LIVE, from admin buttons.

### E. Known bug classes

| Bug | Where to look |
|-----|----------------|
| Sanctuary wrong flyer / series reuse | `sanctuary.ts` match + `applySeriesFlyerReuse` |
| Sports Bra Eventbrite noise | token missing → empty drafts or old EB fallback; QSearch still has EB recipe but must not scan if lane filter works |
| Stags’ Leap vs Stag | `relevance.ts` |
| Logo as poster | `isSanctuaryLogoPoster`, enrich logo strip |
| Past ICS history | `isPastEventListing` after enrich |

## Out of scope

- Catch-all EB keyword sources, Partiful dumps → `/pdx-qsearch-audit`
- Ground-truth Flyer Reader % accuracy → `/pdx-flyer-reader-audit` (but **do** visually confirm venue flyers here)

## Fix policy

- Adapter / policy / flyer matching bugs: implement + re-run trusted smokes.
- Needs bar owner access (Airtable invite): document blocker; propose public-share fetch if appropriate.
- Do not weaken relevance filters to “get more yield.”

## Report format

```markdown
## Trusted audit — YYYY-MM-DD

### Verdict
PASS | PASS WITH ISSUES | FAIL

### Smokes
- smoke-trusted-new-venues: …
- smoke-trusted-flyers: …
- smoke-sports-bra: …

### Per-venue scorecard
| Venue | Feed up? | Events match site? | Flyers correct? | Policy | Notes |
|-------|----------|--------------------|-----------------|--------|-------|
| Sanctuary | | | | | |
| … | | | | | |

### Critical / High
- …

### Blockers (access / env)
- e.g. SPORTS_BRA_AIRTABLE_TOKEN valid but no base permission

### Recommended next steps
1. …
```
