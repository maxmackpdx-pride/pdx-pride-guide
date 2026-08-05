---
schemaVersion: 1
noteId: 2026-08-04T023407Z-tech-stack-monitor-created
generatedAt: 2026-08-04T02:34:07Z
ownerRole: other
visibility: internal-shareable
status: current
sourceConversation: 019fc94c-ede9-7e23-97da-ccbfdc3103b9
supersedes: null
---

# Tech Stack guide, monitor, and password recovery

## What changed

- `[founder-direction]` Tucker requested a canonical Tech Stack Library section, a recurring Tech Stack Monitor, Marketing and Business coordination, and forgot-password support.
- `[implemented]` The Library now maps the stack, email split, secrets policy, monitoring contract, cost ownership, and recovery expectations.
- `[implemented]` A read-only Monday Tech Stack Monitor now routes delivery findings to Marketing and cost or renewal findings to Business; both existing agent prompts consume its evidence.
- `[implemented-locally]` Product code now supports generic password-reset requests, hashed single-use 60-minute tokens, Resend delivery, a reset page, and rate limiting. Type-check passed.
- `[verified-evidence]` Railway contains the production variable name `RESEND_API_KEY`; no value was read or recorded.

## Why it matters

Zaylist now has one recoverable operational map and a bounded evidence loop. Password recovery is ready for production review without exposing credentials, account existence, reset tokens, recipient lists, or private contact messages.

## Decisions and authority

- Founder direction: Marketing, Business, and Tech Stack operations must share useful context over time.
- Accepted/current: Human mailbox stays in Microsoft 365; transactional delivery stays in Resend; credentials stay outside the Library and repository.
- Recommendation: Ship the isolated password-recovery files, wait for Railway success, then perform one private end-to-end reset test.
- Unknown: Production delivery remains unproven until the code is shipped and a real reset email arrives.

## Dependencies and handoffs

- Needs from Tucker: explicit push or ship approval.
- Provides to Marketing Agent: transactional template and deliverability status.
- Provides to Business Planning Agent: verified free-tier and operational dependency context.
- Provides to Tech Stack Monitor: password-reset delivery as a recurring health concern.

## Next action

- Owner: Tucker and Product Engineering.
- Action: approve the isolated production push, observe GitHub-to-Railway success, then test one reset privately.
- Approval required: explicit push or ship approval; no promotional send is authorized.

## Sources

- Conversation: `019fc94c-ede9-7e23-97da-ccbfdc3103b9`
- Decision record: `foundation/decisions/tech-stack-guide.yaml`
- Production evidence: Railway variable-name-only check; product type-check
- Library: `foundation/tech-stack/guide.json`
