/** Seeded HAÜZ liquidity posts that must always show a DEMO tag. */
const DEMO_USERNAMES = new Set(["hausing_demo", "rowan"]);

export function isHousingDemoAuthor(author?: {
  username?: string | null;
  displayName?: string | null;
} | null): boolean {
  if (!author) return false;
  const username = String(author.username || "").replace(/^@/, "").trim().toLowerCase();
  if (username && DEMO_USERNAMES.has(username)) return true;
  const name = String(author.displayName || "").trim().toLowerCase();
  return name === "rowan" || name.startsWith("rowan ");
}
