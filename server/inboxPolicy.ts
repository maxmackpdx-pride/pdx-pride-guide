/** Server-side response policy; UI visibility is not an authorization boundary. */
export function metricsForInbox<T extends Record<string, any>>(metrics: T, fullAccess: boolean) {
  if (fullAccess) return metrics;
  const allowed = ['liveEvents', 'claimedEvents', 'unclaimedEvents', 'userSubmittedEvents', 'attendances', 'pendingSubmissions', 'gigPosts', 'giftingPosts', 'missedConnections'] as const;
  return Object.fromEntries(allowed.map(key => [key, metrics[key]]));
}

export function mayReleaseQueueClaim(actorId: number, assigneeId: number, ownerAdmin: boolean) {
  return actorId === assigneeId || ownerAdmin;
}
