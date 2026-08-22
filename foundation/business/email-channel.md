# Zaylist email channel

Status: Active internal operating rule
Channel owner: Zaylist Marketing Agent
Cost owner: Zaylist Business Planning Agent
Approval authority: Tucker_PDmaX

Public DNS rechecked on August 7, 2026 establishes two separate email systems and confirms Cloudflare is authoritative for `zaylist.com` through `agustin.ns.cloudflare.com` and `aspen.ns.cloudflare.com`. Zaylist's human mailbox is Microsoft 365 / Exchange Online, administered or provisioned through GoDaddy. Zaylist's scalable no-reply and transactional delivery service is Resend: `resend._domainkey.zaylist.com` publishes Resend's DKIM key, while `send.zaylist.com` publishes Amazon SES feedback MX and SPF records used by the delivery layer. The apex publishes exactly one SPF record authorizing both GoDaddy and Microsoft 365. A real message send and delivery receipt remain unverified.

Authenticated Resend access was verified on August 3, 2026 under the `maxmackpdx` workspace and `maxmackpdx@gmail.com` login. `zaylist.com` is verified in North Virginia (`us-east-1`). Billing shows a free transactional allowance of 3,000 emails and a free marketing allowance of 1,000 contacts at $0 per month, with no payment method and no invoices. Configured sender addresses, forwarding behavior, API integration, and production send status remain to be verified.

The Resend account contains one sending-only API credential named `Zaylist Production`, created six days before the check and showing no activity. No secret value is recorded in the Foundation. On August 3, 2026, a read-only Railway check verified that the production service has a `RESEND_API_KEY` variable name; its value was not read. The product now has a locally implemented, type-checked server-side Resend client for password recovery and private Owner Desk notifications. The password-recovery flow uses hashed, one-time, 60-minute tokens and generic request responses. This code is not production evidence until Tucker approves a push and the GitHub-to-Railway deployment succeeds.

The connected Outlook profile was verified on August 3, 2026 as `tucker@zaylist.com`. The mailbox contains received external mail and Microsoft 365 tenant/security messages, proving that the account is active, connected, and receiving. A read-only search found no sent messages from that address, so outbound sending and any separate no-reply alias remain unverified.

On August 21, 2026, an authenticated, read-only Resend dashboard check confirmed `zaylist.com` remains verified on the free plan with no payment method or invoices. Resend showed no sent email records, delivery logs, or suppressions; transactional delivery therefore remains unproven end to end even though the live application health endpoint reports email configuration. The connected Outlook profile remained available. A Microsoft security recommendation and a service-update notice with an October 2026 action were reported by message metadata only; their bodies were not opened or copied.

## Marketing responsibilities

- Treat Microsoft 365 / Exchange Online as the human mailbox and Resend as the no-reply/transactional delivery channel. Do not combine their permissions, audiences, templates, or billing.
- Maintain a clear separation between transactional messages, ordinary business correspondence, and promotional campaigns.
- Keep an inventory of sender identities, approved templates, audiences, consent source, unsubscribe behavior, suppression lists, and campaign purpose.
- Review delivery, bounce, complaint, unsubscribe, and sender-reputation signals when authenticated evidence is available.
- Draft useful, accessible Zaylist-native email copy and subject lines; do not invent events, partnerships, urgency, or community claims.
- Recommend list hygiene, authentication, template, and deliverability improvements with evidence and an explicit approval request.
- Record material channel changes in Agent Continuity.

## Approval gates

Marketing may inspect, audit, draft, and recommend. Tucker must explicitly approve any send, scheduled send, import, audience upload, list purchase, paid-plan change, sender/domain change, DNS or authentication change, unsubscribe/suppression change, deletion, or external sharing of contact data.

No contact list, recipient address, private founder information, credential, or message history may be copied into public campaign artifacts or external AI services.

## Business responsibilities

Business separately verifies the GoDaddy/Microsoft 365 mailbox expense and the Resend plan, free-tier allowance, usage, overage exposure, renewal or billing cycle, taxes, and invoice evidence. It includes confirmed cost in the expense register and alerts Tucker before a limit, renewal, or interruption risk becomes urgent.

## Weekly handoff

Marketing reports channel health and the next useful email action. Business reports cost and account risk. Unknowns remain unknown; neither agent may treat account access, a sender address, or a successful test as proof of billing, consent, or production readiness.
