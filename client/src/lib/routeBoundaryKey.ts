/**
 * Error-boundary key for a location.
 *
 * Opening an event or a place only changes the tail of the path. Keying the
 * boundary on that full path remounts the board: scroll jumps to the top, the
 * open card is thrown away, and the list loads again. That is the reboot
 * people hit while scrolling and opening. Mapz and Outzide stay one key per
 * path so this does not change how those pages recover.
 */
export function routeBoundaryKey(location: string): string {
  const path = (location.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  if (path === "/events" || path.startsWith("/events/")) return "/events";
  if (path === "/directory" || path.startsWith("/directory/")) return "/directory";
  return path;
}
