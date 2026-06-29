/** Copy link or invoke native Web Share — does not change OG/social images. */
export async function shareEventLink(url: string, title: string): Promise<"shared" | "copied"> {
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