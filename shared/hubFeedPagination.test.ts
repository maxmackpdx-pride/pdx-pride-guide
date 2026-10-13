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

test("People shows member activity and connections while Outside owns destination activity", () => {
  const base = item("social", "2026-10-12T10:00:00Z");
  const rows: HubFeedItem[] = [
    base,
    { ...base, id: "photo", kind: "feed_photo" },
    { ...base, id: "connection", kind: "spotted", author: {displayName:"Anonymous",anonymous:true} },
    { ...base, id: "gift", kind: "gifting" },
    { ...base, id: "community", kind: "community" },
    { ...base, id: "visit", kind: "checkin" },
    { ...base, id: "ride", kind: "outz" },
    { ...base, id: "destination-post", source: {kind:"destination",id:"trail",label:"Trail",href:"/outzide/trail"} },
    { ...base, id: "listing", kind: "event" },
    { ...base, id: "resources", kind: "resource_update" },
  ];
  assert.deepEqual(new Set(pageHubActivity(rows,"people",50).items.map(row=>row.id)),new Set(["social","photo","connection","gift","community"]));
  assert.deepEqual(new Set(pageHubActivity(rows,"outside",50).items.map(row=>row.id)),new Set(["visit","ride","destination-post"]));
});

test("Events includes listings, host updates, RSVPs, and posts attached to an event", () => {
  const base = item("social", "2026-10-12T10:00:00Z");
  const rows: HubFeedItem[] = [base,
    { ...base, id:"listing", kind:"event" }, { ...base, id:"update", kind:"event_update" },
    { ...base, id:"going", kind:"rsvp" },
    { ...base, id:"attached", event:{id:1,title:"Event",venueName:"Place",dateStart:"2026-10-16T20:00:00",admission:"FREE"} },
  ];
  assert.deepEqual(new Set(pageHubActivity(rows,"events",50).items.map(row=>row.id)),new Set(["listing","update","going","attached"]));
});
