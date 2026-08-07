# Zaylist

Portland's queer platform. Events, places, housing, gigs, and the things that
happen after. Live at [zaylist.com](https://www.zaylist.com).

Built and owned by one person. Worked on with several AI models. That second
part is why this repo is organized the way it is.

---

## Where the Foundation lives

The Foundation moved to a private repo: **`maxmackpdx-pride/zaylist-foundation-library`**.

It holds the decisions, the reasoning, the raw session thinking, and the agent
continuity ledger. It is internal and deliberately not public.

The human-readable library is live at
**https://zaylist-foundation-library.maxmackpdx.workers.dev/library**

That library is also where the guides live: Foundation, Design System, Growth &
Storytelling, Business, Tech Stack, Agent Continuity, and Important People.

This repo is the product: the app that runs zaylist.com. It no longer carries
governance records.

## Start here

| You are | Read |
|---|---|
| A person | This file, then the library |
| Any AI agent | `AGENTS.md`, then the library |
| Claude specifically | `CLAUDE.md` (it defers to `AGENTS.md`) |
| Looking for current state | `maxmackpdx-pride/zaylist-foundation-library` |

## Where things live

- `client/` — React frontend
- `server/` — API and ingest
- `shared/` — types shared by both
- `design-system/` and `client/src/components/ds/` — the visual authority
- `docs/` — standards, guardrails, archive
- `scripts/` and `script/` — tooling and validation

## Deploying

Railway auto-deploys on every push to `master`. Pushing is shipping. Operational
rules are in `AGENTS.md` and are not optional.
