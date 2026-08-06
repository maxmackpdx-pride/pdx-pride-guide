# Zaylist Agent Automation Handoff

Saved for cross-platform continuity so Claude can recreate the same scheduled agent program as Codex.

## Scope

- Working repository for all agents: `$ZAYLIST_REPO`

  `$ZAYLIST_REPO` is the local checkout of `maxmackpdx-pride/pdx-pride-guide`.
  Resolve it once per machine and substitute it everywhere a runtime CWD is needed.
  Anything hardcoding an absolute path only runs on one computer, which defeats
  the cross-platform continuity this document exists for.

- Out-of-repo campaign / auditor workspace: `$ZAYLIST_AUDITOR`

  Separate workspace for campaign drafts and auditor material. Deliberately **not**
  inside this git repo. Resolve per machine; see `manifest.json` `outOfRepoPaths`.
  Do not write `$ZAYLIST_REPO/zaylist-auditor/...` as if auditor lived under the clone.

- Live source of truth for Zaylist operations: `https://github.com/maxmackpdx-pride/pdx-pride-guide`
- Do not target legacy/old copies.

## Core constraints (for all agents)

- Read governing Foundation law and relevant source material before acting.
- Evidence-first: verify before claiming status; never invent values for costs, spending, plans, policy, or outcomes.
- Never log or expose secrets, API keys, tokens, session cookies, recipient lists, private messages, or private passwords.
- Never push/deploy, change DNS/keys/SMTP/API settings, alter billing/payment plans, send messages/emails, or publish externally without explicit Tucker approval.
- Maintain continuity notes and concise weekly/focused updates with owner + evidence + required action.
- For ambiguity or major changes, route to Tucker with explicit next action options.

## Agent 1 — Business Planning

- Name: `Zaylist Business Planning Agent`
- File/ID: `zaylist-business-planning-agent`
- Kind: `cron`
- Status target: `PAUSED` (default)
- Schedule: `FREQ=WEEKLY;BYDAY=FR;BYHOUR=9;BYMINUTE=0`
- Model: `gpt-5.6-terra`
- Reasoning effort: `high`
- Execution environment: `local`
- Target project: `077f5e74-fe3d-48cc-a60c-9531cce4ee2f`
- CWD: `$ZAYLIST_REPO`

Purpose:
- Run Zaylist business-planning scans and maintain the living plan.
- Update expense / evidence / renewal / risk / opportunity records.
- Coordinate with Tech Stack monitor for operational costs and with Marketing for channel cost implications.
- Include Portland-first LGBTQ business intelligence (local policy/regulatory/safety/economic shifts).

## Agent 2 — Marketing Agent

- Name: `Zaylist Marketing Agent`
- File/ID: `zaylist-marketing-agent`
- Kind: `cron`
- Status target: `PAUSED` (default)
- Schedule: `FREQ=WEEKLY;BYDAY=WE;BYHOUR=9;BYMINUTE=0`
- Model: `gpt-5.6-terra`
- Reasoning effort: `medium`
- Execution environment: `local`
- Target project: `077f5e74-fe3d-48cc-a60c-9531cce4ee2f`
- CWD: `$ZAYLIST_REPO`

Purpose:
- Produce one practical campaign (<= 8 slides) per scheduled run.
- Use current trend evidence + Zaylist-native direction.
- Draft campaign artifacts in:
  - `$ZAYLIST_AUDITOR/campaigns/` (out-of-repo; resolve via `outOfRepoPaths` in manifest)
- Review Resend/Microsoft 365 delivery and sender/reply policy constraints.

## Agent 3 — Tech Stack Monitor

- Name: `Zaylist Tech Stack Monitor`
- File/ID: `zaylist-tech-stack-monitor`
- Kind: `cron`
- Status target: `PAUSED` (default)
- Schedule: `FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=30`
- Model: `gpt-5.6-terra`
- Reasoning effort: `high`
- Execution environment: `local`
- Target project: `077f5e74-fe3d-48cc-a60c-9531cce4ee2f`
- CWD: `$ZAYLIST_REPO`

Purpose:
- Read-only health/compliance scan:
  - `/api/health`
  - Railway production state
  - DNS checks
  - Resend/Outlook evidence health
  - Plan-limit and operational-risk signals
- Classify findings as verified/inferred/unknown and report clear next action.

## Agent 4 — Design Drift + Campaign Watch

- Name: `Zaylist design drift and campaign watch`
- File/ID: `zaylist-design-drift-and-campaign-watch`
- Kind: `heartbeat`
- Status target: `PAUSED` (default)
- Schedule: `RRULE:FREQ=WEEKLY;INTERVAL=1;BYHOUR=9;BYMINUTE=0;BYDAY=SU,MO,WE,FR`
- Model: `gpt-5.6-terra`
- Reasoning effort: `high`
- Execution environment: `local`
- Target thread id: `019fc94c-ede9-7e23-97da-ccbfdc3103b9`
- CWD: `$ZAYLIST_REPO`

Purpose:
- Validate design-system and live production alignment.
- Flag minor drift and recommend fixes.
- For major divergence, route to Tucker before canonical updates or UI rule changes.

## Ownership and handoff routing

- Business cost/plan decisions and living business updates: **Business Planning Agent**
- Delivery-health and campaign execution decisions: **Marketing Agent** with Tech Stack handoff
- Infrastructure/stack risk and cross-provider operational continuity: **Tech Stack Monitor**
- Canonical design-system divergence and major product rules: Tucker decision gate via Foundation/Design-system standards

## If you need to recreate in another model

Create equivalents of these four automations with the same IDs, schedules, prompts, and constraints above, then keep their status as paused until re-enabled.

## Always-on skills for this mix

Any replacement model should load these skills as baseline:

- `zaylist-foundation`
- `zaylist-design-system`
- `zay-logo-design`
- `zaylist-living-guide-builder`

Treat these as shared memory and execution standards for all continuity work:

- Load the relevant `SKILL.md` files first before changes.
- Read `foundation/agent-continuity/START_HERE.md` before any role action.
- Keep notes in `foundation/agent-continuity` and only promote to production-facing docs after Tucker approval.
