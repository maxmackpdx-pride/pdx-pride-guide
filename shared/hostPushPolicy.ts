export type PushAudience = "everyone" | "followers" | "rsvps";
export type PushTier = "owner" | "paid" | "standard";

export interface PushAllowance {
  /** Max sends inside the window; Infinity for the owner. */
  limit: number;
  /** Window length in days. */
  windowDays: number;
}

export function pushTierFor(user: {
  isPrimaryOwner?: boolean;
  isPaidMember?: boolean;
}): PushTier {
  if (user.isPrimaryOwner) return "owner";
  if (user.isPaidMember) return "paid";
  return "standard";
}

export function pushAllowance(tier: PushTier, audience: PushAudience): PushAllowance {
  if (tier === "owner") return { limit: Number.POSITIVE_INFINITY, windowDays: 0 };
  if (audience === "everyone") return { limit: 0, windowDays: 0 };
  if (tier === "paid") {
    return audience === "followers"
      ? { limit: 1, windowDays: 2 }
      : { limit: 3, windowDays: 1 };
  }
  return audience === "followers"
    ? { limit: 1, windowDays: 5 }
    : { limit: 1, windowDays: 1 };
}

/**
 * Sends remaining in the current window, given the timestamps of past
 * sends to this audience. The server enforces this policy against durable sender history.
 */
export function pushRemaining(
  tier: PushTier,
  audience: PushAudience,
  sentAtIso: string[],
  now: Date = new Date(),
): number {
  const { limit, windowDays } = pushAllowance(tier, audience);
  if (!Number.isFinite(limit)) return Number.POSITIVE_INFINITY;
  if (limit === 0) return 0;
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  const used = sentAtIso.filter((t) => {
    const ms = Date.parse(t);
    return Number.isFinite(ms) && ms > cutoff;
  }).length;
  return Math.max(0, limit - used);
}

export function pushCopyIssue(title: string, body: string) {
  const text = (title + " " + body).toLowerCase().replace(/[’‘]/g, "'");
  if (text.includes("!")) return "Remove the exclamation mark before sending.";
  if (/cancel|postpon|called off|no longer happening|won'?t be happening|will not be happening|not happening tonight|off for tonight|scrapped/.test(text)) {
    return "Describe the current time, place or plan for this notification.";
  }
  return "";
}
