import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type Database from "better-sqlite3";
import type { HubFeedItem } from "@shared/hubFeed";

declare const __RESOURCE_DIRECTORY_REVISION__: string;

/** Built from the directory data, not the UI or build time. Reboots cannot repost it. */
export function resourceDirectoryRevision(): string | null {
  if (typeof __RESOURCE_DIRECTORY_REVISION__ !== "undefined") return __RESOURCE_DIRECTORY_REVISION__;
  try { return createHash("sha256").update(readFileSync("client/src/lib/resourcesData.ts")).digest("hex"); }
  catch { return null; }
}

export function recordResourceRelease(database: Database.Database, revision: string | null, now = new Date().toISOString()): void {
  if (!revision) return;
  database.exec(`CREATE TABLE IF NOT EXISTS hub_section_activity (
    id TEXT PRIMARY KEY, section TEXT NOT NULL, revision TEXT NOT NULL,
    title TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL,
    UNIQUE(section, revision)
  )`);
  const prior = database.prepare("SELECT 1 FROM hub_section_activity WHERE section = 'rezources' LIMIT 1").get();
  database.prepare("INSERT OR IGNORE INTO hub_section_activity(id, section, revision, title, body, created_at) VALUES(?, ?, ?, ?, ?, ?)")
    .run(`rezources-${revision}`, "rezources", revision,
      prior ? "NEEDZ directory updated" : "NEEDZ is in your Hub",
      prior ? "Explore the latest resource listings, services, and ways to give back." : "Follow NEEDZ to keep directory updates here. Open it to find organizations, services, and ways to give back.",
      now);
}

export function resourceReleaseItems(database: Database.Database): HubFeedItem[] {
  return (database.prepare("SELECT id, title, body, created_at FROM hub_section_activity WHERE section = 'rezources' ORDER BY created_at DESC").all() as Array<{ id: string; title: string; body: string; created_at: string }>).map(row => ({
    id: row.id, kind: "resource_update", badge: "NEEDZ", action: "Published a directory update", title: row.title.replace(/ReZources|Rezources|REZOURCES/g, "NEEDZ"), text: row.body.replace(/ReZources|Rezources|REZOURCES/g, "NEEDZ"),
    createdAt: row.created_at, author: { displayName: "Zaylist", photoUrl: "/brand/zaylist-avatar.jpg" },
    source: { kind: "board", id: "rezources", label: "NEEDZ", href: "/needz" },
    link: "/needz", viewerFollowsBoard: true, viewerFollowsSource: true,
  }));
}
