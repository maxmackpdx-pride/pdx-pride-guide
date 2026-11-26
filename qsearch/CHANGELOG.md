# QSearch process — changelog

Every change to how QSearch works: protocol rules, sources, agents, and the
registry. Newest first. The process files (MUSE-AS-QSEARCH.md,
source-memory.md, host-watch-list.md, community-registry.md,
AGENTS-ROSTER.md) are mirrored to GitHub (maxmackpdx-pride/pdx-pride-guide,
qsearch/ folder) whenever they change.

## 2026-11-26
- **Flyer text check** (Tucker): every poster QSearch attaches now gets
  an OCR pass (~/workspace/ocr-check/check_text.py) recording whether
  the art carries any text and whether it carries the event's title,
  in poster-text-flags.json — so cards can add the title exactly when
  the art lacks it (Sanctuary stock photos, Locker Room series art)
  and never duplicate it. Protocol step 6d. A backfill over all
  upcoming posters ran the same day; the card-side rule and an event
  field for the flag went to the main chat as a build item.

## 2026-11-24
- **Three helpers added** (Tucker: "Add three helpers"): series keeper
  (weekly, 90-day series horizon — after The Locker Room lapsed),
  blocked-fix tracker (weekly, keeps blocked-fixes.md until verified
  landed — after 824/2022 sat stuck), drift checker (weekly, mirror
  drift + gate conditions untraceable to Tucker's words — after the
  widened gate and stale mirror sat unnoticed). Roster updated.
- **Roster gate wording corrected:** AGENTS-ROSTER.md still carried the
  widened "clearly-LGBTQ-and-public" contributor condition in two
  places; now matches the corrected gate (public events through the
  founder gate). The full local process package was re-pushed to the
  GitHub mirror the same day — the Nov 24 gate correction had been
  local-only.
- **THE INTAKE GATE + completeness checker** (Tucker): the intake
  treatment is now a blocking gate, written into the protocol's
  Governance section and into CONTRIBUTING.md — an entry missing any
  element (verification, complete entry, verified real logo, front
  shot, search recipe, change log) is INCOMPLETE, not done, and the
  run that creates it either completes the treatment or reports it as
  a named incomplete. New standing step: whoever sources or produces
  a logo for a new entry returns the finished logo itself to Tucker
  when the work is done. New tool: `intake-completeness-check.mjs`
  scans the registry (recipe + change log), Needz resources (logo per
  org, asset resolving), and the directory + communities (logo slot,
  asset resolving) — wired into every normal run as step 6c, reported
  alongside the posterless list. First run (Nov 24, 2026): registry
  71/71 complete; Needz 93/94 (Sunshine Division's logo asset not yet
  resolving live); directory 120 of 161 records with an empty logo
  slot; communities 40 of 44. Written the same day the Sunshine
  Division Needz entry shipped without a logo because the job brief
  never carried the checklist — the gate now travels with the work.
- **Contributor gate correction** (Tucker, Nov 24, 2026): the contributor
  publishing permission no longer carries a "clearly LGBTQ" condition —
  that wording had been widened by mistake into a general contributor
  gate. Contributors publish public events through the founder gate;
  the clearly-LGBTQ condition is FetLife-source-only (FetLife events
  stay off unless their own listing clearly states LGBTQ and public)
  and that rule is unchanged.
- **Intake gate clarification — no approval for user/Tucker entries**
  (Tucker, Nov 24, 2026, from his Nov 23, 2026 design message):
  entries added by a user or by Tucker need no approval — they are
  in, and the intake treatment is applied behind the scenes;
  "Muse verification" in the gate means verifying the facts and
  completing the entry, never approving whether it may exist. The
  clarification is written into the protocol's intake gate and
  mirrored in CONTRIBUTING.md's intake gate section.

## 2026-11-23
- **Recipe backfill completed** (venue hunter, Nov 23, 2026): all 71
  community-registry entries now carry their own search recipe and a
  per-entry change log — the 63 seeded/found entries were backfilled
  from source-memory and the detail-page audit, joining the 8 gap-run
  entries that already had theirs. Two shared patterns are named on
  the entries instead of being rewritten: IG-ORG for directory groups
  and RESIDENCY-HOST-DETAIL for residency nods.
- **Per-entry change logs + intake rule** (Tucker): every registry entry
  now carries a dated change log (added, changes, new additions), and
  recipes are written once — identical recipes name the shared pattern
  instead of being rewritten. Intake rule added to the protocol and the
  registry: every route in (site submission, claim, told-to-an-AI, code)
  gets the full treatment — Muse verification, complete entry, verified
  real logo (SVG conversion, drift/accuracy check, existing logo slots),
  and the front-of-location shot process. Open item: the GPT-written
  front-shot process (effects + storage) is not yet in Muse's files.
- **Search recipes ride on the registry entries** (Tucker): the list with
  everybody on it now carries, for each individual location and person,
  how that entry is searched — update surfaces in order, detail-page
  route, handles, traps. An entry without a recipe is incomplete; the
  venue hunter backfills missing recipes every run, and sweeps follow
  the recipe recorded on the entry.
- **Self-improvement named as a design principle** (Tucker): the whole
  chain — Muse to contributor — is designed to constantly improve
  itself. Written into the protocol's Governance section and into
  CONTRIBUTING.md: fixes into the repair same-run, lessons into
  source-memory, mutual review, health-check test-and-verify, keeper
  honesty; proposals flow up to Muse, who ratifies them in.
- **Registry places lane added to every normal sweep** (Tucker): the
  community registry is a standing sweep input — every registry place
  that hosts or lists events gets its own update surfaces (site,
  calendar, detail pages, official socials) read each run. "Whatever
  place they update," the sweep looks there too. New registry adds join
  the lane automatically.
- **Muse named CEO of QSearch** (Tucker). Governance section added to the
  protocol: Tucker is founder; Muse owns the process, is the ONLY one who
  can remove anything, and the ONLY one who verifies and adds new venues
  and service providers.
- **Contributor framework + orientation added** (CONTRIBUTING.md): agents
  from other AI platforms may copy this process to contribute — they check
  each other's changes, bring candidates and problems to Muse's
  attention, and may publish missed events only when clearly LGBTQ and
  public through the founder gate. Removals and venue/provider adds are
  Muse's alone.
- **GitHub keeper added** (weekly): keeps the GitHub mirror in sync with
  the local process files, verifies read-back, checks changelog coverage,
  flags unaccounted changes to Muse.
- **Venue & community hunter added** (weekly) and **reverification hunter
  added** (monthly) at Tucker's direction, with the community registry as
  their master document: every entry records why it's on Zaylist, how we
  got the info, and where to verify it in the future. Stale entries get a
  needs-verification status, never removal. Residency rule: hosting a
  community event does not make a venue LGBTQ; a regular residency earns
  the venue a community-friendly "residency nod" instead.
- **Agents roster created** (AGENTS-ROSTER.md): every agent's name, job,
  and frequency, per Tucker's ask.
- **GitHub storage established** for the whole QSearch process: protocol,
  source memory, watch list, registry, roster, and this changelog.
- **Detail pages are the source of record** — new standing rule in the
  protocol's "Rules that do NOT change," wired into the sweep instructions
  and the biweekly health check. An index/calendar/API-list read is
  discovery only; events are read on their own detail pages before
  publishing. New sources must record their detail-page route before their
  first publish. (From Tucker's Q Center catch + the same-day audit:
  Eagle Portland, Sanctuary, QSC, Darcelle carry the real info one click
  deeper; Naked Pool ids 1652–1657 sat wrong by 7 hours from an
  index-level read.)
- **Q Center detail-page rule**: every Q Center event is read on its
  follow-up page ("About this event"); the listing page alone never
  publishes. Rendered-browser pass required (the page is JS-rendered).

## 2026-11-21
- **Biweekly health check created** — audits lanes, sources, machinery,
  and protocol hygiene; fixes and re-verifies in the same run.
- **Sign-up count rides every QSearch run** — the homepage's
  new-users-in-90-days number is fetched, logged, and reported each sweep.
- **Partiful restated as a discovery lane** — public Portland LGBTQ events
  are swept and published with their cover art; private invitations are
  reported to Tucker, never published.

## 2026-11-19
- **Poster hunter runs after every QSearch run** (standing cadence).
- **Ticket-page rule**: before an event counts as posterless, its ticket
  page and every official link are checked for the official image.

## 2026-11-18
- **Poster orientation rule**: when two official posters exist, wide and
  tall, attach the tall one.

## 2026-11-12
- **Coverage safeguard (the Red Hanky rule)**: host-discovery pass in every
  run, recurrence ledger checks, lane-coverage reporting, and every fix
  written into the protocol or source-memory in the same run.
- **Signed-out rule**: any lane found signed out is the first line of the
  report, never a footnote.

## 2026-10-30
- **Publish immediately**: founder-gated finds publish right away; report
  after. ("Never wait for me ones like the 12. Push right away.")

## 2026-10-25
- **One source is enough**: one current official source verifying title,
  exact venue, and start date/time publishes an event. Never require two.
