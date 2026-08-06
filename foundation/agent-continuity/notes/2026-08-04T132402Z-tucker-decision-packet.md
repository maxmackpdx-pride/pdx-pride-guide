# Tucker Decision Packet: Open Owner Gates

Created: 2026-08-04T13:24:02Z
Author: Claude (secondary continuity owner)
Status: decision_required (owner: Tucker)
Visibility: internal-shareable

## Context source (authoritative)

- foundation/agent-continuity/current-context.json
- foundation/agent-continuity/conflicts.json
- foundation/agent-continuity/latest.md
- CLAUDE.md
- foundation/agent-continuity/automation-handoff.md

Evidence verified 2026-08-04: both gate quotes below match conflicts.json and current-context.json verbatim. No status has been promoted. Unknown remains unknown.

## Open gate 1: CONFLICT-DOWNLOAD-ADOPTION

Evidence:
- current-context.json blocker: "Verified download/adoption lacks an approved technical definition and authoritative measurement source".
- conflicts.json question: "What exact event counts as a verified download versus adoption?"

Why it blocks: no meaningful goal progress, campaign conversion, or 90-day adoption status can be reported safely until the unit and source are approved.

Decision needed from Tucker:
1. Canonical download/adoption unit. Example candidates: file-complete plus 30s page view, or verified file transfer plus one engagement action, or first-open/install event. Also name the allowed telemetry source.
2. Threshold windows (for example 30, 60, 90 days) and the confidence requirement.
3. Which sources count if several exist: frontend, server log, analytics, storage hits.

Foundation recommendation (tier 4, not an approval): adopt one server-confirmed event as the canonical unit rather than a raw page hit, because it is the hardest to inflate and the easiest to audit. Pin the 90-day window to the active priority review date already on file (2026-08-17). Claude cannot verify which telemetry sources actually exist without a read-only stack check, so treat any specific source list as unverified until confirmed.

## Open gate 2: CONFLICT-HOMEPAGE-WORDMARK

Evidence:
- current-context.json blocker: "Homepage wordmark asset loads and occupies its box but was visually absent in audited desktop and mobile views."
- conflicts.json question: "Is this implementation defect, intentional exception, or canonical identity change?"

Why it blocks: design trust and campaign hero identity consistency are ambiguous.

Decision needed from Tucker:
1. Confirm the invisible wordmark is a bug and restore the current treatment.
2. Confirm it is an intentional exception and document the exception scope in the Foundation or guide.
3. Approve an identity update and roll a new canonical rule through implementation.

Foundation recommendation (tier 4, not an approval): default to option 1 (defect, restore) unless you intend an identity change. The Foundation protects one identity under Things We Will Not Build, and the agent rule already on file is do not normalize the invisible treatment. An asset that loads and occupies its box but renders invisible reads as a defect, not a designed choice.

## Routing while gates are open

- Marketing: do not declare campaign outcomes tied to adoption or homepage-led channels until both gates resolve.
- Tech Stack Monitor: continue read-only operational checks. No deployment action.
- Design Drift: do not normalize the invisibility behavior in design standards until the wordmark decision is resolved.
- Business Planning: defer adoption metrics until the download definition is approved.

## Automation note

All four scheduled agents are configured and PAUSED:
- Business Planning: weekly Fri 09:00
- Marketing: weekly Wed 09:00
- Tech Stack Monitor: weekly Mon 08:30
- Design Drift and Campaign Watch: heartbeat Sun, Mon, Wed, Fri 09:00

These live on the Codex side. This note does not change their state.
