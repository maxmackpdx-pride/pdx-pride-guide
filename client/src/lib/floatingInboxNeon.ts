export type FloatingInboxNeon = {
  id: "blue";
  color: string;
  /** Space-separated for `rgb(var(--fab-neon-rgb) / alpha)` */
  rgb: string;
};

/**
 * The inbox is one color, always: the deep-glass drawer blue. The button, the
 * sheet rim and the unread badge all read it, so the inbox looks the same in
 * every room and on every load.
 */
export const FLOATING_INBOX_NEON: FloatingInboxNeon = { id: "blue", color: "#1a4dff", rgb: "26 77 255" };

export function pickFloatingInboxNeon(): FloatingInboxNeon {
  return FLOATING_INBOX_NEON;
}
