export function contextTypeOf(
  msg: { contextType?: string; context_type?: string } | null | undefined,
): string | undefined {
  return msg?.contextType || msg?.context_type;
}

export function inboxContextBadge(contextType?: string | null): string | null {
  const ctx = String(contextType || "").toUpperCase();
  if (ctx === "EVENT_TALENT_REQUEST") return "LINEUP REQUEST";
  if (ctx === "MISSED_CONNECTION") return "MISSED CONNECTION";
  if (ctx === "EVENT_INVITE") return "EVENT INVITE";
  if (ctx === "HOST_UPDATE" || ctx === "HOST_MESSAGE") return "HOST UPDATE";
  if (ctx === "GIFTING") return "GIFTING";
  if (ctx === "GIG") return "GIG WORK";
  if (ctx === "RIVER_BRATS_CHECKIN" || ctx === "BEACH_CARPOOL") return "RIVER BRATS";
  return null;
}

export function notifyContextTag(contextType?: string | null): string {
  const ctx = String(contextType || "").toUpperCase();
  if (ctx === "MISSED_CONNECTION") return "Mizzed Connection";
  if (ctx === "GIG" || ctx === "EVENT_TALENT" || ctx === "EVENT_TALENT_REQUEST") {
    return "Gigz";
  }
  if (ctx === "GIFTING") return "GiftZ";
  if (
    ctx === "EVENT_HOST"
    || ctx === "HOST_UPDATE"
    || ctx === "HOST_MESSAGE"
    || ctx === "EVENT_INVITE"
  ) {
    return "Event host";
  }
  if (ctx === "CHECK_IN" || ctx === "RIVER_BRATS_CHECKIN" || ctx === "BEACH_CARPOOL") {
    return "Check-in";
  }
  return "Message";
}

/** Event id when the thread is an invite/host update that should open EventModal. */
export function eventIdFromInboxContext(
  contextType?: string | null,
  contextId?: number | null,
): number | null {
  const id = Number(contextId);
  if (!Number.isInteger(id) || id <= 0) return null;
  const ctx = String(contextType || "").toUpperCase();
  if (ctx === "EVENT_INVITE" || ctx === "HOST_UPDATE" || ctx === "HOST_MESSAGE" || ctx === "EVENT_HOST") {
    return id;
  }
  return null;
}

export function contextLabelOf(
  msg: { contextLabel?: string | null; context_label?: string | null } | null | undefined,
): string | null {
  const label = msg?.contextLabel ?? msg?.context_label;
  return label?.trim() ? label : null;
}