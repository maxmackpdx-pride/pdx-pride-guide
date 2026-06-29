export function contextTypeOf(
  msg: { contextType?: string; context_type?: string } | null | undefined,
): string | undefined {
  return msg?.contextType || msg?.context_type;
}

export function inboxContextBadge(contextType?: string | null): string | null {
  if (contextType === "EVENT_TALENT_REQUEST") return "LINEUP REQUEST";
  if (contextType === "MISSED_CONNECTION") return "MISSED CONNECTION";
  if (contextType === "HOST_MESSAGE") return "HOST UPDATE";
  return null;
}

export function contextLabelOf(
  msg: { contextLabel?: string | null; context_label?: string | null } | null | undefined,
): string | null {
  const label = msg?.contextLabel ?? msg?.context_label;
  return label?.trim() ? label : null;
}