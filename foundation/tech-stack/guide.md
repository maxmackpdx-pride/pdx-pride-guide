# Zaylist Tech Stack

Release: `zaylist-tech-stack-2026-08-21.1`
State: Current
Owner: Tucker_PDmaX
Canonical source: `foundation/tech-stack/guide.json`

## Purpose

The Tech Stack guide gives one founder and trusted agents a recoverable map of what runs Zaylist, why each service exists, what it costs, who can access it, what failure would affect, and how to recover without exposing secrets.

## Authority

Tucker's explicit decisions outrank accepted Foundation and Design System rules. Verified production and provider evidence describe current implementation. Provider documentation supports operational facts. Recommendations and unknowns remain labeled.

## Stack map

| Layer | Current system | Purpose | State | Evidence boundary |
| --- | --- | --- | --- | --- |
| Product | React, TypeScript, Express, Node.js | Human-facing web application and server API | Implemented | Repository and production |
| Hosting | Railway, project `pdx-pride-guide`, production service `pdx-pride-guide` | Build, runtime, environment variables, volume, health checks | Implemented | Railway and `/api/health` |
| Data | SQLite on Railway persistent volume | Product records and durable application state | Implemented | Repository and Railway volume |
| Repository | GitHub `maxmackpdx-pride/pdx-pride-guide`, `master` | Source, CI, production release path | Implemented | GitHub and local checkout |
| Design authority | Zaylist Foundation Library and canonical Design System | Product principles, UI rules, history, agent context | Current | Cloudflare live guide and editable GitHub source |
| Human email | Microsoft 365 / Exchange Online administered through GoDaddy | `tucker@zaylist.com` mailbox and ordinary correspondence | Implemented | Outlook profile, DNS, GoDaddy evidence |
| Transactional delivery | Resend on Amazon SES infrastructure | Password recovery, transactional notifications, approved email delivery | Implemented locally; production activation pending | Resend account, DNS, Railway variable-name check, repository |
| AI collaborators | Codex, Claude, and authorized ChatGPT contexts | Codex recurring agents and implementation; Claude bounded research, review, synthesis, and second opinions; ChatGPT private project context and specialized handoffs | Current | Founder direction, automation configuration, and Agent Continuity |
| Analytics | Google Analytics integration where configured | Verified product-use evidence | Configuration-dependent | Repository and provider evidence |

## DNS and email authority

Cloudflare is authoritative for `zaylist.com` with nameservers `agustin.ns.cloudflare.com` and `aspen.ns.cloudflare.com`. GoDaddy remains the registrar and Microsoft 365 administration path, but its non-authoritative DNS zone does not control public resolution.

The public apex has exactly one SPF record: `v=spf1 include:secureserver.net include:spf.protection.outlook.com -all`. The Microsoft 365 verification TXT remains separate. Resend identity and return-path evidence remains intact: `resend._domainkey.zaylist.com` publishes the Resend DKIM key, `send.zaylist.com` publishes Amazon SES MX and SPF, and `_dmarc.zaylist.com` publishes DMARC quarantine policy. A real message send and delivery receipt are still required for end-to-end proof.

## Email systems

Microsoft 365 and Resend are separate systems. Microsoft 365 is the human mailbox. Resend is the API delivery service. Resend is verified for `zaylist.com`, has a free allowance of 3,000 transactional emails and 1,000 marketing contacts, and currently has no payment method or invoice. Marketing owns content, consent, templates, and deliverability. Business owns allowance, cost, renewal, and interruption risk. Engineering owns server-side integration and secret handling.

No agent may send or schedule promotional email, import contacts, change DNS, change a plan, add a payment method, rotate a credential, or change unsubscribe/suppression behavior without Tucker's explicit approval.

## Security and secrets

- Credentials live only in the relevant provider secret store or local ignored environment file.
- Never store complete keys in the Library, repository, campaign artifacts, logs, screenshots, or Agent Continuity.
- Client code never receives provider secrets.
- Use the narrowest permission practical and record only credential name, permission scope, creation date, last-used state, and rotation status.
- Password-reset tokens are cryptographically random, stored only as hashes, short-lived, single-use, and invalidated after successful use.
- Password-recovery requests return the same public response whether the account exists or not.
- Claude and other external AI services receive only the minimum context required for the bounded task. Never send secrets, private founder-finance records, NDA-protected material, recipient data, or unrelated personal context without Tucker's explicit authorization for that exact use.

### Evidence update: 2026-08-21

- `[verified]` The Railway production service, the live health endpoint, and GitHub `master` all reported revision `5a030301e9181fe16161f92c2f8f902978a9c604`; the active Railway deployment was successful.
- `[verified]` A provider read response returned confidential variable values when the monitor requested names only. Those values are intentionally omitted from this guide and Agent Continuity. Treat the returned production credentials as compromised until Tucker approves a provider-console rotation plan.
- `[verified]` The production manifest constrains Node.js to `>=20.19.0 <21`; Node.js v20 is end-of-life. The production dependency audit also reported two high-severity advisories, through `@google-analytics/data` and `express-rate-limit` transitive paths. Remediation requires an approved source change and release.

## AI collaboration boundary

Claude is part of the working tech stack, not a Zaylist product feature or source of automatic authority. Use it for bounded research, critique, synthesis, and second opinions. Record durable outcomes in the governed Foundation or Agent Continuity sources rather than depending on a Claude conversation as institutional memory. Tucker remains the final authority, and external AI output remains recommendation or evidence until verified and adopted.

## Tech Stack Monitor

The monitor is read-only by default. It checks production health, current GitHub/Railway deployment alignment, persistent storage risk, dependency and runtime drift, Cloudflare nameserver and DNS authority, Resend and Outlook readiness, free-tier and renewal exposure, secret-name presence without reading values, access/recovery gaps, and recent material changes. It records evidence and alerts Tucker; it does not deploy, rotate keys, change plans, change DNS, send email, or modify infrastructure.

### Evidence update: 2026-08-21

- `[verified]` Public web and email DNS records remain consistent with Cloudflare authority, Microsoft 365 SPF, Resend DKIM, Amazon SES return-path records, and DMARC quarantine policy.
- `[verified]` Resend lists `zaylist.com` as verified, on the free plan with no payment method or invoices, but has no sent-email records, event logs, or suppressions. Transactional delivery is configured but unproven end to end.
- `[reported]` The connected Microsoft 365 mailbox is available and contains a Microsoft security recommendation plus a service-update notice with an October 2026 action. Their bodies were not opened or copied; mailbox-owner review is required.
- `[unknown]` Railway metrics show approximately 0.66 GB disk use on the attached persistent volume, but the monitor could not verify volume capacity, backup freshness, export recoverability, or Railway billing evidence through a safe read-only surface.

## Evidence history

- `2026-08-21` - Weekly read-only operational scan recorded aligned live/GitHub/Railway revision evidence, verified Resend's still-unused state, a confidential-variable exposure during name-only inspection, Node 20 end-of-life, two high-severity production dependency advisories, and unresolved storage/recovery evidence. See the governed Agent Continuity note for owners and next actions.

## Cost and recovery

Every service record should include provider, product, purpose, owner, access path, cost and cadence, allowance, next renewal, auto-renew state, failure impact, recovery path, export path, and exit option. Unknown means unknown. Confirmed cost requires account or invoice evidence.

## Current founder priority

Approve and ship the locally verified password-recovery integration, then prove one production reset end to end without exposing the token or recipient address. Keep transactional email separate from marketing consent and let the Tech Stack Monitor surface drift before it becomes an outage or surprise charge.
