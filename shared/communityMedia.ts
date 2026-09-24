/** Only RedGIFs watch/embed links are safe to use in community media iframes. */
export function redgifsMedia(value: unknown): { watchUrl: string; embedUrl: string } | null {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !["redgifs.com", "www.redgifs.com", "v3.redgifs.com"].includes(url.hostname) || url.username || url.password || url.port) return null;
    const match = url.pathname.match(/^\/(?:watch|ifr)\/([a-zA-Z0-9-]{3,100})\/?$/);
    if (!match) return null;
    return { watchUrl: `https://www.redgifs.com/watch/${match[1]}`, embedUrl: `https://www.redgifs.com/ifr/${match[1]}` };
  } catch { return null; }
}
