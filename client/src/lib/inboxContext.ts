export function contextTypeOf(
  msg: { contextType?: string; context_type?: string } | null | undefined,
): string | undefined {
  return msg?.contextType || msg?.context_type;
}

export function inboxContextBadge(contextType?: string | null): string | null {
  if (contextType === "EVENT_TALENT_REQUEST") return "LINEUP REQUEST";
  if (contextType === "MISSED_CONNECTION") return "MISSED CONNECTION";
  if (contextType === "EVENT_INVITE") return "EVENT INVITE";
  if (contextType === "HOST_UPDATE" || contextType === "HOST_MESSAGE") return "HOST UPDATE";
  return null;
}

export function notifyContextTag(contextType?: string | null): string {
  if (contextType === "MISSED_CONNECTION") return "Missed Connections";
  if (contextType === "GIG" || contextType === "EVENT_TALENT" || contextType === "EVENT_TALENT_REQUEST") {
    return "Gigs";
  }
  if (
    contextType === "EVENT_HOST"
    || contextType === "HOST_UPDATE"
    || contextType === "HOST_MESSAGE"
    || contextType === "EVENT_INVITE"
  ) {
    return "Event host";
  }
  if (contextType === "CHECK_IN") return "Check-in";
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