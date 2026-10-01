const STORAGE_KEY = "pdx-floating-inbox-corner";

export const FLOATING_INBOX_SIZE_PX = 72;
export const FLOATING_INBOX_EDGE_PX = 32;

export type FloatingInboxCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type FloatingInboxPosition = { x: number; y: number };

export function positionForFloatingInboxCorner(
  corner: FloatingInboxCorner,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): FloatingInboxPosition {
  return {
    x: corner.endsWith("right")
      ? Math.max(FLOATING_INBOX_EDGE_PX, viewportWidth - FLOATING_INBOX_SIZE_PX - FLOATING_INBOX_EDGE_PX)
      : FLOATING_INBOX_EDGE_PX,
    y: corner.startsWith("bottom")
      ? Math.max(FLOATING_INBOX_EDGE_PX, viewportHeight - FLOATING_INBOX_SIZE_PX - FLOATING_INBOX_EDGE_PX)
      : FLOATING_INBOX_EDGE_PX,
  };
}

export function clampFloatingInboxPosition(
  position: FloatingInboxPosition,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): FloatingInboxPosition {
  return {
    x: Math.max(FLOATING_INBOX_EDGE_PX, Math.min(position.x, viewportWidth - FLOATING_INBOX_SIZE_PX - FLOATING_INBOX_EDGE_PX)),
    y: Math.max(FLOATING_INBOX_EDGE_PX, Math.min(position.y, viewportHeight - FLOATING_INBOX_SIZE_PX - FLOATING_INBOX_EDGE_PX)),
  };
}

export function nearestFloatingInboxCorner(
  position: FloatingInboxPosition,
  viewportWidth = window.innerWidth,
  viewportHeight = window.innerHeight,
): FloatingInboxCorner {
  const vertical = position.y + FLOATING_INBOX_SIZE_PX / 2 < viewportHeight / 2 ? "top" : "bottom";
  const horizontal = position.x + FLOATING_INBOX_SIZE_PX / 2 < viewportWidth / 2 ? "left" : "right";
  return `${vertical}-${horizontal}`;
}

export function readFloatingInboxCorner(): FloatingInboxCorner {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "top-left" || value === "top-right" || value === "bottom-left" || value === "bottom-right") {
      return value;
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
  return "bottom-right";
}

export function writeFloatingInboxCorner(corner: FloatingInboxCorner): void {
  try {
    localStorage.setItem(STORAGE_KEY, corner);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
