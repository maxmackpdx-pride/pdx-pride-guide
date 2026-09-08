export function safeMapReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/map") || /[\r\n\\]/.test(value)) return undefined;
  try {
    const url = new URL(value, "https://www.zaylist.com");
    return url.origin === "https://www.zaylist.com" && url.pathname === "/map" ? url.pathname + url.search : undefined;
  } catch { return undefined; }
}
