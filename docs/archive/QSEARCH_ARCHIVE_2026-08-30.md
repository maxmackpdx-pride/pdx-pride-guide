# QSEARCH archive

QSEARCH was retired from the live Zaylist product on August 30, 2026.

The complete pre-retirement implementation is preserved on the GitHub branch:

`archive/qsearch-legacy-2026-08-30`

Archive commit:

`bcb28c4d4550e6f29cc6882bc37481784adb1926`

## What retirement means

- The QSEARCH admin navigation is removed.
- Legacy QSEARCH API actions return `410 Gone`.
- The nightly QSEARCH scraper/model scheduler does not start.
- Existing published events are preserved.
- Historical QSEARCH database tables and candidate records are preserved.
- The scraper's source list, parsing code, trusted-source adapters, tests, and
  model integration remain recoverable from the archive branch.
- The replacement agent has a read-only source-memory endpoint at
  `/api/admin/event-research/source-memory`. It includes curated and trusted
  URLs, learned recipe/resolved URLs, parser history, source health, directory
  websites/social handles, and browser-only Facebook/Instagram pathways.
- The agent can append source observations through the authenticated
  `/api/admin/event-research/source-memory/path` endpoint. Successful pathways,
  failures, replacements, evidence notes, and consecutive-failure history are
  retained so later runs can self-heal without opaque model retraining. Each
  path also stores its reusable navigation recipe, whether sign-in was needed,
  which event fields it supplied, and the last successful recipe, so later runs
  start with the fastest known route instead of rediscovering it.
- The source-memory response also carries the useful legacy flyer-audit
  playbook: OCR is supporting evidence, flyer fields must agree with the event,
  logos/calendar heroes are not event art, and old series art needs current
  official confirmation before reuse.
- Sports Bra's old direct schedule scraper stays retired. QSearch 2.0 may
  research Sports Bra through the browser (official site, Facebook, Instagram,
  and official ticket pages), but each event still needs event-specific LGBTQ+
  relevance and an exact venue/address match.

## Replacement

Event discovery and fact-checking are handled by the recurring **QSearch 2.0**
agent. It runs every other day, can delegate discovery,
fact-checking, and artwork/deduplication to sub-agents, and uses official-source
evidence rather than the archived QSEARCH model.

Do not reactivate only part of the old system. Recovery should begin from the
archive branch in an isolated review branch, followed by current data and
security checks before any production connection is restored.
