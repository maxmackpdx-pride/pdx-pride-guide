# Zaylist expense monitoring

Status: Active internal process  
Owner: Business Planning Agent  
Approval authority: Tucker_PDmaX

The expense loop protects Tucker's immediate stability while keeping Zaylist reliable. It monitors confirmed recurring charges, renewal dates, usage drivers, avoidable add-ons, and upcoming cash requirements.

## Sources

### ChatGPT Finance Liaison

Provides only the minimum NDA-protected personal-finance constraints needed for business decisions: essential floor, maximum safe Zaylist spend, immediate dates, and material tax, benefits, debt, or housing constraints. It does not share full transaction history or unrelated personal spending.

### Railway

Check the real `pdx-pride-guide` production project. Record confirmed plan/usage charges from Railway billing evidence when accessible, renewal or billing-cycle dates, service/storage/database usage drivers, and unusual changes. Service metrics are operational evidence, not a substitute for an invoice or billing statement.

Do not create projects, services, databases, volumes, buckets, environments, or deployments as part of cost monitoring. Do not change plans or delete infrastructure without Tucker's explicit approval and a production-impact review.

### GoDaddy

Check authenticated account evidence for Zaylist-related domains, products, renewal dates, auto-renew status, privacy products, email, certificates, hosting, and add-ons. A domain appearing in Zaylist documentation does not prove GoDaddy is its registrar; verify account ownership and product association.

Do not purchase, renew, cancel, transfer, unlock, change nameservers, change DNS, disable privacy, or modify payment methods without Tucker's explicit approval.

### Resend no-reply and transactional delivery

Public DNS checked August 3, 2026 verifies Resend as the no-reply/transactional provider: the domain publishes a Resend DKIM selector and the `send` subdomain publishes Amazon SES delivery records. Tucker reports that it was selected on a free tier for an affordable path to scaling. Verify the current plan, allowance, usage, overage pricing, billing state, sender identities, forwarding behavior, API integration, and production send status from authenticated Resend or application evidence. Marketing owns channel health and content; Business owns cost and plan-limit monitoring. Do not treat transactional delivery as permission for bulk marketing; promotional email still requires an approved consent and unsubscribe workflow.

Do not send or schedule messages, import or export contacts, buy lists, change plans, add payment methods, change sender identities, change DNS/domain authentication, or modify unsubscribe/suppression settings without Tucker's explicit approval.

## Weekly output

- Confirmed monthly recurring expense total.
- Confirmed annual/irregular expenses and the monthly reserve needed.
- Charges due in 7, 30, and 90 days.
- New, increased, duplicate, unused, or unverified charges.
- Infrastructure usage changes that could predict future cost.
- Email delivery usage, plan-limit risk, and authenticated billing status.
- Personal-affordability status from the Finance Liaison: safe, constrained, acute, or unknown.
- One recommended action with savings, risk, and approval needed.

## Alert thresholds

Alert Tucker when:

- Any previously unknown recurring charge is verified.
- A charge increases by more than 10% or $10, whichever is smaller.
- A renewal is due within 30 days and the reserve is not confirmed.
- Auto-renew status is unexpected or unverified.
- A domain, production service, database, or storage resource risks interruption.
- Total confirmed Zaylist spending exceeds the approved safe monthly cap.
- The Finance Liaison reports an acute personal constraint requiring immediate cost review.

## Evidence standard

Every amount records currency, cadence, source, checked date, next due date when known, confidence, and whether tax is included. Never estimate a charge as confirmed. Unknown charges remain unknown.
