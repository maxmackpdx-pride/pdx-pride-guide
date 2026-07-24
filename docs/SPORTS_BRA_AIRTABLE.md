# The Sports Bra — official schedule via Airtable

The Sports Bra publishes the games it's showing in an Airtable base, embedded on
`thesportsbraofficial.com/pages/portland`. We read that base directly with
Airtable's official REST API instead of the old Eventbrite keyword search, which
pulled in city-wide "sports" noise (church pickleball, barbell certs, etc.).

Games with no attached flyer get a clean auto-generated poster
(`server/posters/gamePoster.ts`) — Swedish/Scandinavian minimal, matched to the
Sports Bra's pink-on-warm-white brand.

## What you need (one-time)

1. **A Personal Access Token** from Airtable — the bar (or whoever owns the base)
   creates it at https://airtable.com/create/tokens with:
   - Scope: `data.records:read` (and `schema.bases:read` so we can auto-find the
     table).
   - Access: the Sports Bra base (id `appMRorYHS2sB2qeZ`).
2. **Set it on Railway** as an environment variable — never commit it to the repo:

   | Variable | Value | Required |
   | --- | --- | --- |
   | `SPORTS_BRA_AIRTABLE_TOKEN` | the `pat…` token | yes |
   | `SPORTS_BRA_AIRTABLE_BASE` | `appMRorYHS2sB2qeZ` | no (default) |
   | `SPORTS_BRA_AIRTABLE_TABLE` | table name, e.g. `Schedule` | no (auto-discovered) |
   | `SPORTS_BRA_AIRTABLE_VIEW` | a view name to restrict to | no |

That's it. On the next trusted sync, Sports Bra games flow into the Review queue
with posters attached. Until the token is set, the venue falls back to the
(now venue-scoped) Eventbrite feed so it's never empty.

## Field mapping (resilient — no exact config needed)

The connector auto-detects fields by name (case-insensitive):

- **Date** — a field matching `date`/`day` (ISO `2026-08-01`, or `8/1/2026`).
- **Time** — `time`/`kickoff`/`start`/`tip`/`first pitch`/`puck`, or the time
  portion of a datetime Date field. Missing time → defaulted with a reviewer
  warning.
- **League/sport** — `league`/`sport`/`competition`.
- **Teams** — `home` + `away`/`opponent`/`visitor`, or a single
  `matchup`/`game`/`event`/`title` string.
- **Flyer** — an attachment field (`flyer`/`poster`/`image`); if present, the
  real image wins over the generated poster.
- **Notes** — `note`/`detail`/`description`.

If the bar's column names are unusual, set `SPORTS_BRA_AIRTABLE_TABLE` and we can
tune the detection.

## Product locks preserved

- Everything lands in the **Review queue** — never auto-LIVE.
- Admission is never invented as FREE (defaults `UNKNOWN`).
- Age is not forced (bar-restaurant; verify note left for the reviewer).

## The poster generator

`renderGamePosterPng({ league, tag, away, home, dateLabel, timeLabel })` returns
a PNG. It's served statelessly at `GET /api/game-poster?league=…&away=…&home=…&date=…&time=…`
(small in-memory cache, 1-day browser cache). Fonts (Archivo woff2) are embedded
in the SVG and rasterized with `sharp`, so it renders identically on Railway with
no system-font install. Offline tests: `npx tsx script/smoke-sports-bra.ts`.
