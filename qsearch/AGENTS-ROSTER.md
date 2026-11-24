# QSearch agents — names, jobs, frequency

Every agent in the QSearch system, what it does, and how often it runs.
Kept current whenever an agent is added, retimed, or retired — log the
change in CHANGELOG.md in the same pass. (Tucker, Nov 23, 2026.)

**Governance:** Tucker is the founder. **Muse is the CEO of QSearch** —
owns the process, is the only one who can remove anything, and the only
one who verifies and adds new venues and service providers. Contributing
agents from other AI platforms work under CONTRIBUTING.md: they check
each other's changes, bring things to Muse's attention, and may publish
missed public events through the founder gate.

| Agent | Job | Frequency |
|---|---|---|
| **Muse as QSearch** (paired agent) | The researcher/publisher itself: holds the Zaylist admin pairing, runs the lanes, publishes through the event-research API under the founder rules in MUSE-AS-QSEARCH.md | Always on — acts when a run fires or Tucker asks |
| **GitHub keeper** (`qsearch-github-keeper`) | Keeps the GitHub mirror (pdx-pride-guide, qsearch/) in sync with the local process files; verifies read-back; confirms every change has a changelog entry; flags contributor changes it cannot account for to Muse's attention — it syncs and flags, it does not remove or rewrite | Weekly |
| **Contributing agents** (other AI platforms) | Copy this process to help: check each other's changes, surface candidate venues/providers and problems to Muse, publish missed public events per CONTRIBUTING.md | Varies by platform |
| **Discovery sweep** (`qsearch-discovery-sweep`) | Full event discovery across every lane (venues, Facebook, Instagram, host-discovery pass, Partiful, FetLife); publishes founder-gate finds live; re-arms the poster hunter; records the 90-day sign-up count | Every 48 hours |
| **Poster hunter** (`qsearch-poster-hunter`) | Hunts missing flyers for posterless live events, soonest-first, in founder source order; attaches only visually verified exact-event art | One-shot, re-armed ~30 min after every discovery sweep |
| **EOD metrics** (`qsearch-eod-metrics`) | Daily counts: added / edited / removed-hidden (old vs upcoming), posterless today + last 7 days | Daily, ~11:42 PM PT |
| **Health check** (`qsearch-health-check`) | Audits the whole apparatus: every signed-in lane functioning to its purpose, sources answering per recipe, standing machinery intact, protocol hygiene incl. the detail-page rule; fixes and re-verifies in the same run; publishes nothing | Every 2 weeks |
| **Venue & community hunter** (`qsearch-venue-hunter`) | Finds NEW Portland LGBTQ venues/shops (community-owned), new clubs and organizations, residency nods for community-friendly venues, and openly-out service providers; verifies each against an official source and writes it into community-registry.md with why / how-we-know / where-to-verify | Weekly |
| **Reverification hunter** (`qsearch-reverify-hunter`) | Re-checks registry entries at their verify-at sources, oldest first; refreshes last-verified dates; entries that can't be re-verified get the needs-verification status — never removed | Monthly |
| **Series keeper** (`qsearch-series-keeper`) | Checks every recurring series in the recurrence ledger 90 days out (past the sweep's 30-day window); editions missing inside a series' own rule are published through the founder gate or flagged with the reason — a monthly series never just stops (added Nov 24, 2026, after The Locker Room lapsed past November) | Weekly |
| **Blocked-fix tracker** (`qsearch-blocked-fix-tracker`) | Keeps the list of record fixes that could not land (locked fields, rejected saves, invalid stored data, owed backfills) in blocked-fixes.md; re-checks each against the live record until it is verified landed, then closes it with evidence; anything blocked over 14 days leads its report (added Nov 24, 2026, after events 824/2022 sat stuck) | Weekly |
| **Drift checker** (`qsearch-drift-checker`) | Compares the local process files against the GitHub mirror and pushes or flags any difference the changelog doesn't explain; scans the protocol, CONTRIBUTING.md, and this roster for gate conditions that cannot be traced to Tucker's own words and flags them to Muse — it never edits a gate itself (added Nov 24, 2026, after a widened gate and a stale mirror sat unnoticed) | Weekly |

Delivery for all scheduled agents: the QSearch chat. Standing rules that
bind every agent live in MUSE-AS-QSEARCH.md ("Rules that do NOT change").
