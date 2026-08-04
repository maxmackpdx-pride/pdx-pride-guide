# Claude continuity operating packet for Zaylist

Use this file to hand continuity to another AI model quickly.

## Quick intent

Keep all future model continuity work recoverable when chats split across Codex, Claude, and others.  
Primary goal: no hidden assumptions, no lost decisions, and no accidental production truth drift.

## Grounding sources

Read in this order:

1. [foundation/agent-continuity/manifest.json](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/manifest.json)
2. [foundation/agent-continuity/START_HERE.md](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/START_HERE.md)
3. [foundation/agent-continuity/current-context.json](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/current-context.json)
4. [foundation/agent-continuity/conflicts.json](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/conflicts.json)
5. [foundation/agent-continuity/latest.md](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/latest.md)
6. [foundation/agent-continuity/events.jsonl](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/events.jsonl)
7. [foundation/agent-continuity/automation-handoff.md](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/automation-handoff.md)
8. [foundation/agent-continuity/notes/2026-08-04T132402Z-owner-decisions-download-and-wordmark.md](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/notes/2026-08-04T132402Z-owner-decisions-download-and-wordmark.md)

Additional context files:

- [foundation/agent-continuity/README.md](/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/README.md)
- [foundation/chapters/agent-continuity.md](/Users/tuckercasey/Documents/Zaylist/foundation/chapters/agent-continuity.md)
- [foundation/decisions/agent-continuity.yaml](/Users/tuckercasey/Documents/Zaylist/foundation/decisions/agent-continuity.yaml)
- [foundation/decisions/tech-stack-guide.yaml](/Users/tuckercasey/Documents/Zaylist/foundation/decisions/tech-stack-guide.yaml)

## Required baseline skills

Load these first in every replacement model session:

- [zaylist-foundation](/Users/tuckercasey/.codex/skills/zaylist-foundation/SKILL.md)
- [zaylist-design-system](/Users/tuckercasey/.codex/skills/zaylist-design-system/SKILL.md)
- [zay-logo-design](/Users/tuckercasey/.codex/skills/zay-logo-design/SKILL.md)
- [zaylist-living-guide-builder](/Users/tuckercasey/.codex/skills/zaylist-living-guide-builder/SKILL.md)

## Canonical repository context

- Working repo: `/Users/tuckercasey/Documents/Zaylist`
- Canonical git remote: `github` -> `https://github.com/maxmackpdx-pride/pdx-pride-guide` on `master`
- Deploy remote (legacy): `sites`

## Run order for every role action

1. Read this packet.
2. Read the required foundation files above.
3. Confirm conflicts and current context before recommendation.
4. Verify evidence category: accepted, verified, recommendation, unknown.
5. Update continuity artifacts only when evidence changes.
6. Keep all notes visibility tagged and source linked.

## Required behavior

- Evidence first. No invented claims about status, billing, outcomes, policy, or security posture.
- No secrets, API keys, tokens, passwords, private messages, or personal data.
- Never treat local edits as shipped.
- Do not push/deploy/change DNS or billing settings without explicit owner approval.
- Always call out unknowns and blockers clearly.
- Maintain the privacy split:
  - `internal-nda-protected` in private workspace only.
  - `public-approved` only when Tucker explicitly approves.

## AI collaboration doctrine (from the Foundation)

Run every action through the Foundation's human-first, agent-first-class layer, not just by loading the baseline skill:

- People come first in UI, copy, and policy. AI supports people, operations, and continuity.
- Do not introduce or keep AI features only because they are technically possible.
- External AI output, Claude included, is recommendation or evidence until Tucker verifies and adopts it.
- Send only minimum-necessary context to any external AI. Get explicit Tucker approval before sharing NDA, private-finance, secret, recipient, or personal data.
- Structure objects for identity, provenance, freshness, relationships, permissions, limitations, and available actions, and expose machine-readable information through stable documented interfaces.
- Agent actions are enabled only with authorization, audit trail, expiration, revocation, and human confirmation.

## Scheduled agent program

If recreating in another model, use these four entries with existing IDs and schedules:

- `zaylist-business-planning-agent`  
  Cron weekly Friday 09:00
- `zaylist-marketing-agent`  
  Cron weekly Wednesday 09:00
- `zaylist-tech-stack-monitor`  
  Cron weekly Monday 08:30
- `zaylist-design-drift-and-campaign-watch`  
  Heartbeat Sun, Mon, Wed, Fri at 09:00

Default is paused unless Tucker restarts them.

## Scripted continuity checks

- Dry run current branch: `./scripts/sync-continuity.sh --dry-run`
- Dry run against canonical remote: `./scripts/sync-continuity.sh github master --dry-run`
- Real continuity sync to canonical: `./scripts/sync-continuity.sh github master`

## Handoff prompt to paste into the next model

```text
You are the continuity owner for Zaylist. Use the Zaylist Foundation, continuity ledger, and canonical remote model.  
Read these in order: foundation/agent-continuity/START_HERE.md, manifest.json, current-context.json, conflicts.json, latest.md, events.jsonl, automation-handoff.md, and relevant notes.  
Load baseline skills zaylist-foundation, zaylist-design-system, zay-logo-design, and zaylist-living-guide-builder first.  
Do evidence first, no secrets, no em dashes, and no production claims from local changes.  
Use ./scripts/sync-continuity.sh github master --dry-run before any real push to confirm status.
```

## What is known

- GitHub remote is present and canonical for continuity.
- Continuity hardening, dry run mode, and baseline skills are already documented and committed.
- Default agent schedules are stored and set to paused.
- `decisions.json` file is not present in this repo. Decision sources are currently:
  - `foundation/decisions/*.yaml`
  - `foundation/agent-continuity/*`

## What is unknown

- Whether Tucker wants a scheduled CI-only approval-free continuity sync to run automatically.
- Whether future sessions should include a separate repository-facing handoff index for third party model tools.

## What is blocked

- Any model may not run deploy, DNS, or billing actions without explicit owner authorization.

## What is waiting approval

- Moving from manual continuity sync to any unattended approval-only automation.
- Any scope expansion beyond continuity, campaign drafting, and cost-risk tracking.

## Known owners

- Codex: planning, continuity gates, implementation, and commit/release coordination.
- Claude: documentation passes, campaign drafts, structured summaries.
- Tucker: final decisions, approvals, and any production changes.
