/** Attribution on an unclaimed tip does not assign management. Older hosted listings
 * may only have an organizer recorded in submittedBy until a primary host is assigned. */
export function legacyOrganizer(event: {submittedBy?: string|null; claimedBy?: string|null; isClaimable?: boolean; source?: string|null}, hasHosts: boolean) {
  return !hasHosts && !event.isClaimable && !event.claimedBy?.trim() && event.source !== "community_tip"
    ? event.submittedBy : undefined;
}
