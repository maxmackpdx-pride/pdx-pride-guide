/** Copy link or invoke native Web Share — shares a URL, never a card image. */
export async function sharePageLink(url: string, title: string): Promise<"shared" | "copied"> {
  const absolute = url.startsWith("http") ? url : `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url: absolute });
      return "shared";
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") throw err;
    }
  }
  await navigator.clipboard.writeText(absolute);
  return "copied";
}

/** @deprecated Prefer sharePageLink — same behavior for event URLs. */
export const shareEventLink = sharePageLink;