/**
 * Board 18: demo content is data. The server marks seeded demo records with
 * isDemo; pages read the flag and never check usernames themselves.
 */
const DEMO_USERNAMES = new Set(["hausing_demo", "rowan"]);

export function isDemoAuthor(author?: { username?: string | null; displayName?: string | null } | null): boolean {
  if (!author) return false;
  const username = String(author.username || "").replace(/^@/, "").trim().toLowerCase();
  if (username && DEMO_USERNAMES.has(username)) return true;
  const name = String(author.displayName || "").trim().toLowerCase();
  return name === "rowan" || name.startsWith("rowan ");
}
