// Event research accepts the guide's hero palette and its two supporting colors.
export const EVENT_ACCENT_TOKENS = new Set([
  "#0066FF", "#00FFFF", "#FF1FA0", "#D4FF00", "#7B00FF",
  "#FF7B00", "#FF0000", "#2BFF00", "#FFDD00", "#FF5F6D",
]);

/** Normalize legacy flyer colors at the public event API. Invalid data uses the day token. */
export function publicEventAccent(value: unknown): string | null {
  if (typeof value !== "string" || !/^#[a-f0-9]{6}$/i.test(value)) return null;
  const hex = value.toUpperCase();
  if (EVENT_ACCENT_TOKENS.has(hex)) return hex;
  const rgb = (color: string) => [1,3,5].map(offset => parseInt(color.slice(offset,offset+2),16));
  const input = rgb(hex);
  let chosen = null, best = Infinity;
  for (const token of EVENT_ACCENT_TOKENS) {
    const score = rgb(token).reduce((total, channel, i) => total + (channel - input[i]) ** 2, 0);
    if (score < best) { chosen = token; best = score; }
  }
  return chosen;
}
