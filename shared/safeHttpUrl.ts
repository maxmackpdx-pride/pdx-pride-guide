/**
 * Allow only http(s) and same-origin paths. Drops javascript:, data:, and
 * other schemes so ticket/website hrefs cannot become XSS vectors.
 */
export function publicHttpUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}
