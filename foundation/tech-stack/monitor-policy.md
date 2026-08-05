# Tech Stack Monitor policy

Status: Current founder direction  
Owner: Tucker_PDmaX  
Default power: Read-only

## Weekly checks

- Probe `https://www.zaylist.com/api/health` and record the reported deployment identity when available.
- Compare GitHub `master`, the local production checkout, and the active Railway production deployment without changing any branch.
- Check Railway service, deployment, persistent-volume, environment, and cost-risk evidence. Inspect secret names only; never print values.
- Check public DNS for the production web domains, Microsoft 365 mail routing, Resend SPF/DKIM/return path, and DMARC.
- Check authenticated Resend metadata when access exists: verified domain, plan, allowance, usage, failures, complaints, bounces, key scope/last use, webhooks, and billing state. Never expose keys or send mail.
- Check Outlook connectivity and material Zaylist service/security notices without modifying the mailbox.
- Check runtime and dependency drift against supported versions and current official documentation when it could affect security, cost, or reliability.
- Check whether current backups, exports, credential recovery paths, and owner access are evidenced. Unknown remains unknown.
- Reconcile verified costs with `foundation/business/expense-register.json` and hand material changes to the Business Agent.
- Hand email deliverability, template, consent, and channel findings to the Marketing Agent.

## Alert immediately

- Production health fails or deployment state is failed/crashed.
- GitHub and Railway production revisions materially diverge.
- Persistent storage is missing, near capacity, or not recoverable.
- A domain, certificate, DNS, mailbox, or sending domain risks interruption.
- A secret is absent, exposed, over-permissioned, or unexpectedly active.
- Resend approaches 80 percent of an allowance, gains a payment method unexpectedly, or records unusual bounce/complaint activity.
- A new recurring charge, renewal within 30 days, or cost increase crosses the Business Agent threshold.
- A security advisory materially affects the live runtime or direct dependencies.

## Approval gates

The monitor cannot deploy, push, merge, rotate credentials, create keys, send email, change DNS, change plans, add payment methods, delete data, restore backups, change access, or publish Library changes without Tucker's explicit approval.
