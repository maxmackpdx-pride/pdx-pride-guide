---
schemaVersion: 1
noteId: 2026-08-21T070956Z-tech-stack-monitor-weekly-operational-scan
generatedAt: 2026-08-21T07:09:56Z
ownerRole: other
visibility: internal-shareable
status: current
sourceConversation: zaylist-tech-stack-monitor
supersedes: null
---

# Weekly tech stack operational scan: production aligned, security and runtime work required

## What changed

- `[verified | 2026-08-21T07:09:56Z]` Live `/api/health`, GitHub `master`, and the active Railway production deployment all reported revision `5a030301e9181fe16161f92c2f8f902978a9c604`; health returned HTTP 200 and the deployment was `SUCCESS`.
- `[verified | 2026-08-21T07:09:56Z]` A Railway provider response returned confidential variable values during a monitor request that was limited to variable names. No values are recorded here. The affected production credentials must be treated as compromised pending Tucker-approved rotation.
- `[verified | 2026-08-21T07:09:56Z]` Resend has a verified `zaylist.com` domain, free transactional and marketing subscriptions, no payment method or invoices, and no sent-email records, logs, or suppressions. The live health endpoint says email is configured, but no real transactional delivery is evidenced.
- `[verified | 2026-08-21T07:12:09Z]` Public DNS remains consistent with Cloudflare authority, Microsoft 365 SPF, Resend DKIM, Amazon SES return-path records, and DMARC quarantine policy.
- `[verified | 2026-08-21T07:12:09Z]` The production manifest permits only Node.js 20, which is end-of-life. `npm audit --omit=dev` reported two high-severity production dependency advisories through the `@google-analytics/data` and `express-rate-limit` dependency paths.
- `[verified | 2026-08-21T07:12:09Z]` The real local production checkout is on `master` but is dirty and behind GitHub `master`; it is not a safe source for a release until synchronized and cleaned. The documentation workspace is also not a deploy checkout.
- `[reported | 2026-08-21T07:09:56Z]` The connected Outlook profile is available. Microsoft message metadata reports one security recommendation and one service-update notice with an October 2026 action; bodies were not opened or copied.
- `[unknown | 2026-08-21T07:09:56Z]` Railway reported about 0.66 GB disk use on the persistent volume, but capacity, backup freshness, recovery/export evidence, and billing evidence could not be safely verified.

## Why it matters

Production availability is currently good, but credentials observed through the monitor require immediate containment. Unsupported Node runtime and high-severity dependency advisories raise security and continuity risk. Resend's unused state means password-reset delivery still cannot be claimed as proven.

## Finding register

| Finding | Classification | Source and checked time | Owner | Consequence | Next safe action |
| --- | --- | --- | --- | --- | --- |
| Live/GitHub/Railway revision alignment | verified | Health endpoint, GitHub API, Railway deployment metadata; 2026-08-21T07:09:56Z | Tech Stack Monitor | No release mismatch or health interruption observed | Continue weekly read-only comparison |
| Confidential credential exposure through provider read response | verified | Railway provider response; 2026-08-21T07:09:56Z. Values omitted | Tucker_PDmaX | Returned production credentials must be treated as compromised | Approve a provider-console rotation plan; do not place replacements in notes or chat |
| Resend delivery remains unproven | verified | Authenticated Resend dashboards and live health endpoint; 2026-08-21T07:09:56Z | Marketing Agent | Password-reset and transactional delivery cannot be claimed as working | After rotation, obtain Tucker approval for one controlled transactional proof |
| Node 20 end-of-life and two high advisories | verified | GitHub production manifest, locked dependency tree, npm audit, official Node lifecycle; 2026-08-21T07:12:09Z | Product Engineering | Security fixes and supported-runtime coverage are constrained | Prepare a scoped Node LTS/dependency update for Tucker approval |
| Dirty, stale local production checkout | inferred | Local checkout status and revision compared with GitHub `master`; 2026-08-21T07:12:09Z | Tucker_PDmaX | An accidental release from local state could diverge from the live source | Synchronize only through the normal release workflow after preserving unrelated work |
| Microsoft 365 security/service notices | reported | Outlook message metadata only; 2026-08-21T07:09:56Z | Tucker_PDmaX | An unreviewed tenant recommendation or October service action may age into interruption risk | Review the notices directly in Microsoft 365; do not forward their contents to agents |
| Volume capacity, backups, recovery, and Railway billing | unknown | Railway metrics and safe provider read surfaces; 2026-08-21T07:09:56Z | Business Planning Agent | Storage or renewal risk cannot be quantified and no cost can be confirmed | Obtain provider-console evidence in a Tucker-approved read-only review |

## Decisions and authority

- Founder direction: the monitor is read-only; no rotation, deployment, dependency update, billing, DNS, or email send was performed.
- Accepted/current: unknown remains unknown for volume capacity, backups, recovery, and Railway billing.
- Recommendation: Tucker should authorize credential rotation first, then approve a scoped Node LTS and dependency-remediation release. Do not perform an end-to-end reset until the replacement credential is installed through the normal production release path.
- Unknown: whether a user has requested a password reset since the current Resend domain was activated; no recipient or message data was inspected.

## Dependencies and handoffs

- Provides to Marketing Agent: Resend domain and plan are healthy, but zero sends/logs/suppressions mean transactional delivery and sender behavior are unproven. Draft no campaign action; recommend a Tucker-approved, post-rotation transactional proof only.
- Provides to Business Planning Agent: no Resend bill, payment method, or renewal change was verified. Railway billing and persistent-volume capacity remain unknown; no charge may be recorded from metrics alone.
- Needs from Tucker: approval for emergency credential rotation scope and for the subsequent runtime/dependency remediation release.

## Next action

- Owner: Tucker_PDmaX.
- Action: approve an immediate provider-console rotation plan for every production credential returned by the unsafe Railway read response; preserve the new values only in approved secret stores.
- Approval required: explicit Tucker approval before rotation, any variable change, dependency update, push, deployment, email send, or production password-reset proof.

## Sources

- Conversation: Zaylist Tech Stack Monitor automation run, 2026-08-21.
- Production evidence: `https://www.zaylist.com/api/health`; Railway project `pdx-pride-guide`, production service and deployment metadata; public DNS; authenticated Resend dashboard; connected Outlook metadata.
- Source evidence: GitHub `maxmackpdx-pride/pdx-pride-guide` `master`; production manifest and dependency audit.
- Runtime lifecycle: official Node.js releases page.
