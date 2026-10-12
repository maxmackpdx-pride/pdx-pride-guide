import assert from "node:assert/strict";
import { test } from "node:test";
import { pageHubActivity, hubActivityTime } from "./hubFeedPagination";
import type { HubFeedItem } from "./hubFeed";
const item = (id: string, createdAt: string): HubFeedItem => ({ id, createdAt, kind: "feed_text", badge: "Post", action: "Posted", author: { displayName: "Member" } });
test("mixed SQLite and ISO times sort by actual publication time", () => {
  assert.equal(hubActivityTime("2026-10-12 10:00:00"), Date.parse("2026-10-12T10:00:00Z"));
  assert.deepEqual(pageHubActivity([item("old", "2026-10-12T08:00:00Z"), item("new", "2026-10-12 10:00:00")], "all", 20).items.map(row => row.id), ["new", "old"]);
});
test("every same-second item survives paging, including different punctuation in source IDs", () => {
  const items = ["event-bundle-A", "feed_post-1", "feed_post-2", "checkin-1", "outz-post-1"].map(id => item(id, "2026-10-12T10:00:00Z"));
  const found: string[] = []; let cursor: string | undefined;
  do { const page = pageHubActivity(items, "all", 2, cursor); found.push(...page.items.map(row => row.id)); cursor = page.nextCursor ?? undefined; } while (cursor);
  assert.equal(new Set(found).size, items.length);
  assert.equal(found.length, items.length);
});
test("Following includes an individual destination or community without a whole-board follow", () => {
  const followed = { ...item("followed", "2026-10-12T10:00:00Z"), viewerFollowsSource: true, viewerFollowsBoard: false };
  assert.deepEqual(pageHubActivity([followed, item("other", "2026-10-12T10:00:00Z")], "followed_boards", 20).items.map(row => row.id), ["followed"]);
});
