# QSearch agents — names, jobs, frequency

Every agent in the QSearch system, what it does, and how often it runs.
Kept current whenever an agent is added, retimed, or retired — log the
change in CHANGELOG.md in the same pass. (Tucker, Nov 23, 2026.)

| Agent | Job | Frequency |
|---|---|---|
| **Muse as QSearch** (paired agent) | The researcher/publisher itself: holds the Zaylist admin pairing, runs the lanes, publishes through the event-research API under the founder rules in MUSE-AS-QSEARCH.md | Always on — acts when a run fires or Tucker asks |
| **Discovery sweep** (`qsearch-discovery-sweep`) | Full event discovery across every lane (venues, Facebook, Instagram, host-discovery pass, Partiful, FetLife); publishes founder-gate finds live; re-arms the poster hunter; records the 90-day sign-up count | Every 48 hours |
| **Poster hunter** (`qsearch-poster-hunter`) | Hunts missing flyers for posterless live events, soonest-first, in founder source order; attaches only visually verified exact-event art | One-shot, re-armed ~30 min after every discovery sweep |
| **EOD metrics** (`qsearch-eod-metrics`) | Daily counts: added / edited / removed-hidden (old vs upcoming), posterless today + last 7 days | Daily, ~11:42 PM PT |
| **Health check** (`qsearch-health-check`) | Audits the whole apparatus: every signed-in lane functioning to its purpose, sources answering per recipe, standing machinery intact, protocol hygiene incl. the detail-page rule; fixes and re-verifies in the same run; publishes nothing | Every 2 weeks |
| **Venue & community hunter** (`qsearch-venue-hunter`) | Finds NEW Portland LGBTQ venues/shops (community-owned), new clubs and organizations, residency nods for community-friendly venues, and openly-out service providers; verifies each against an official source and writes it into community-registry.md with why / how-we-know / where-to-verify | Weekly |
| **Reverification hunter** (`qsearch-reverify-hunter`) | Re-checks registry entries at their verify-at sources, oldest first; refreshes last-verified dates; entries that can't be re-verified get the needs-verification status — never removed | Monthly |

Delivery for all scheduled agents: the QSearch chat. Standing rules that
bind every agent live in MUSE-AS-QSEARCH.md ("Rules that do NOT change").
