name: zaylist-claude-continuity
description: Bootstrap and run continuity-compatible Zaylist work across AI models with evidence-first checkpoints, protected context, and the correct sync commands.
user-invocable: true

# Zaylist Claude Continuity Bootstrap

Load this when a new AI model starts continuity work on Zaylist.

## First 60 second startup

1. Read the installed repository packet at  
   `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/claude-continuity-operating-packet.md`
2. Load baseline skills first:
   - `zaylist-foundation`
   - `zaylist-design-system`
   - `zay-logo-design`
   - `zaylist-living-guide-builder`
3. Read:
   - `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/START_HERE.md`
   - `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/manifest.json`
   - `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/current-context.json`
   - `/Users/tuckercasey/Documents/Zaylist/foundation/agent-continuity/conflicts.json`
4. Report the current unknowns and blockers before proposing any directional change.

## Operating constraints

- Evidence first. No invented claims about production status, costs, policy, security, or outcomes.
- No em dashes in user-facing copy.
- Do not expose secrets, credentials, private messages, or passwords.
- Do not promote continuity notes into canonical decisions without Tucker approval.
- Do not push/deploy/DNS/send outbound billing actions without explicit approval.
- Use visibility labels on notes and keep private context out of public artifacts.

## Canonical project links

- Repo: `/Users/tuckercasey/Documents/Zaylist`
- Canonical GitHub remote: `github` at `https://github.com/maxmackpdx-pride/pdx-pride-guide` (branch `master`)
- Legacy deploy remote: `sites`

## Required output rhythm

For any material change, include:

- Outcome
- Evidence source
- Decision status
- Unknowns
- Next owner and action
- Approval needed
- Freshness or expiry

## Sync checklist

- `./scripts/sync-continuity.sh --dry-run`
- `./scripts/sync-continuity.sh github master --dry-run`
- `./scripts/sync-continuity.sh github master`

## Scheduled continuity agents

Recreate only if needed with the same ids and schedules, paused by default:

- `zaylist-business-planning-agent` weekly Fri 09:00
- `zaylist-marketing-agent` weekly Wed 09:00
- `zaylist-tech-stack-monitor` weekly Mon 08:30
- `zaylist-design-drift-and-campaign-watch` heartbeat Sun, Mon, Wed, Fri 09:00

## Known unknown block

Use the four section split in your continuity notes:

- What is known
- What is unknown
- What is blocked
- What is waiting approval

## Delivery mode

This skill should be paired with the repo packet for local continuity storage and handoff.

