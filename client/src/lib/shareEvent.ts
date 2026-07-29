/** Copy link or invoke native Web Share - shares a URL, never a card image. */
export async function sharePageLink(
  url: string,
  title: string,
  text?: string,
): Promise<"shared" | "copied"> {
  const absolute = url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title,
        url: absolute,
        ...(text ? { text } : {}),
      });
      return "shared";
    } catch (err) {
      // User dismissed the share sheet: rethrow so callers can stay quiet.
      if ((err as DOMException)?.name === "AbortError") throw err;
      // Other share failures fall through to clipboard copy.
    }
  }
  // Clipboard fallback: include share text when provided so paste still has context.
  await navigator.clipboard.writeText(text ? `${text}\n${absolute}` : absolute);
  return "copied";
}

/** Event detail / card share (same transport as sharePageLink). */
export const shareEventLink = sharePageLink;

/** Board page share (Events list, Gifting, Housing, etc.). */
export const shareBoardLink = sharePageLink;

/** Toast titles so board ≠ event in UI copy. */
export function shareToastTitle(
  result: "shared" | "copied",
  kind: "event" | "board" | "venue" | "listing" | "page" = "page",
): string {
  if (result === "shared") {
    if (kind === "event") return "Shared this event";
    if (kind === "board") return "Shared this board";
    if (kind === "venue") return "Shared this venue";
    if (kind === "listing") return "Shared this listing";
    return "Shared";
  }
  if (kind === "event") return "Event link copied";
  if (kind === "board") return "Board link copied";
  if (kind === "venue") return "Venue link copied";
  if (kind === "listing") return "Listing link copied";
  return "Link copied to clipboard";
}