/** A Zaylist destination stays a web URL today and can become a Universal Link later. */
export function appDestination(path: string): string {
  const url = new URL(path, "https://www.zaylist.com");
  if (url.origin !== "https://www.zaylist.com" || !path.startsWith("/") || path.startsWith("//")) {
    throw new Error("App destination must be a Zaylist path");
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
