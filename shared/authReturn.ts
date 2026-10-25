export function safeMapReturnTo(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/map") || /[\r\n\\]/.test(value)) return undefined;
  try {
    const url = new URL(value, "https://www.zaylist.com");
    return url.origin === "https://www.zaylist.com" && url.pathname === "/map" ? url.pathname + url.search : undefined;
  } catch { return undefined; }
}

/** Google sign-in return paths: the map (with filters) and the bare Admin page. */
export function safeGoogleReturnTo(value: unknown): string | undefined {
  if (value === "/admin") return "/admin";
  return safeMapReturnTo(value);
}
