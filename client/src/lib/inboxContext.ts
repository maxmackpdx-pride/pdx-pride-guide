export function contextTypeOf(
  msg: { contextType?: string; context_type?: string } | null | undefined,
): string | undefined {
  return msg?.contextType || msg?.context_type;
}

export function inboxContextBadge(contextType?: string | null): string | null {
  if (contextType === "EVENT_TALENT_REQUEST") return "LINEUP REQUEST";
  if (contextType === "MISSED_CONNECTION") return "MISSED CONNECTION";
  if (contextType === "HOST_UPDATE" || contextType === "HOST_MESSAGE") return "HOST UPDATE";
  return null;
}

export function notifyContextTag(contextType?: string | null): string {
  if (contextType === "MISSED_CONNECTION") return "Missed Connections";
  if (contextType === "GIG" || contextType === "EVENT_TALENT" || contextType === "EVENT_TALENT_REQUEST") {
    return "Gigs";
  }
  if (contextType === "EVENT_HOST" || contextType === "HOST_UPDATE" || contextType === "HOST_MESSAGE") {
    return "Event host";
  }
  if (contextType === "CHECK_IN") return "Check-in";
  return "Message";
}

export function contextLabelOf(
  msg: { contextLabel?: string | null; context_label?: string | null } | null | undefined,
): string | null {
  const label = msg?.contextLabel ?? msg?.context_label;
  return label?.trim() ? label : null;
}