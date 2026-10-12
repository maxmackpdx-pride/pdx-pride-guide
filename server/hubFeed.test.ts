import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { recordResourceRelease, resourceReleaseItems } from "./hubSectionActivity";
mkdirSync(".local", { recursive: true });
const directory = mkdtempSync(path.resolve(".local/hub-feed-test-"));
process.env.DATABASE_PATH = path.join(directory, "data.db");
process.env.FOLLOW_ALL_DEFAULT = "0";
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite, storage, setBoardFollowing } = await import("./storage");
const { createOutzWallPost, followOutzDestination, unfollowOutzDestination, upsertOutzCheckin } = await import("./outzSocial");
await import("./qsearch/seedMissingYearround");
const { ensureCommunityTables } = await import("./communities");
ensureCommunityTables();
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });
const now = new Date().toISOString();
const user = (name: string) => Number(sqlite.prepare("INSERT INTO users(username,email,password_hash,status) VALUES(?,?,?,'active')").run(`hub_test_${name}`, `${name}@hub.test`, "test-only").lastInsertRowid);
const viewer = user("viewer"), author = user("author"), stranger = user("stranger");
const feed = (tab = "following") => storage.getHubFeed({ viewerUserId: viewer, tab: tab as any, limit: 50 });
const publish = (body: string, audience = "ALL") => storage.createHubFeedPost({ userId: author, postType: "text", audience, body, status: "LIVE" } as any);

test("person follow and unfollow immediately control Following, with server block enforcement", () => {
  const post = publish("follow-me-test");
  assert.equal(feed().items.some(row => row.id === `feed_post-${post.id}`), false);
  storage.followUser(viewer, author);
  assert.equal(feed().items.some(row => row.id === `feed_post-${post.id}`), true);
  storage.unfollowUser(viewer, author);
  assert.equal(feed().items.some(row => row.id === `feed_post-${post.id}`), false);
  storage.followUser(viewer, author); storage.blockMember(viewer, author);
  assert.equal(feed("all").items.some(row => row.id === `feed_post-${post.id}`), false);
  assert.equal(storage.voteOnHubPost(post.id, viewer, 1).error, "Not found");
  assert.equal(storage.createContentReply("HUB", post.id, viewer, "Should not send").error, "Not found");
  storage.unblockMember(viewer, author);
});

test("venue follow includes its new event, with the listing timestamp and no future-date bump", () => {
  const business = Number(sqlite.prepare("INSERT INTO businesses(name,type,description,active,created_at) VALUES('Hub Test Venue','venue','test',1,?)").run(now).lastInsertRowid);
  const event = storage.createEvent({ title: "Hub Test Event", venueName: "Hub Test Venue", description: "test", dateStart: "2027-04-01T20:00:00", dateEnd: "2027-04-01T23:00:00", dayOfWeek: "THU", status: "LIVE", source: "user_submitted" } as any);
  storage.followBusiness(viewer, business);
  const item = feed().items.find(row => row.event?.id === event.id || row.events?.some(value => value.id === event.id));
  assert.ok(item);
  assert.equal(item.createdAt, event.createdAt);
  assert.equal(item.source?.kind, "place");
  storage.unfollowBusiness(viewer, business);
  assert.equal(feed().items.some(row => row.event?.id === event.id), false);
});

test("individual trail follows reach Following, stop on unfollow, and never leak another member's private check-in note", () => {
  createOutzWallPost({ placeId: "hub-test-trail", userId: author, postKind: "TRIP_NOTE", body: "hub trail public note", tripDate: null });
  followOutzDestination(viewer, "hub-test-trail", "Hub Test Trail");
  const row = feed().items.find(value => value.text === "hub trail public note");
  assert.equal(row?.source?.label, "Hub Test Trail");
  assert.equal(row?.viewerFollowsSource, true);
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  upsertOutzCheckin({ userId: author, placeId: "hub-test-trail", arrivalHour: 12, departHour: 15, note: "private exact meetup", calendarDate: date, isAnonymous: false });
  const aggregate = feed().items.find(value => value.id.startsWith("outz-checkin-hub-test-trail"));
  assert.ok(aggregate);
  assert.equal(aggregate.author.anonymous, true);
  assert.equal(JSON.stringify(aggregate).includes("private exact meetup"), false);
  assert.equal(JSON.stringify(aggregate).includes("hub_test_author"), false);
  unfollowOutzDestination(viewer, "hub-test-trail");
  assert.equal(feed().items.some(value => value.id === row?.id), false);
});

test("community following respects active membership and the per-community mute", () => {
  sqlite.prepare("INSERT INTO communities(id,slug,name,created_at,updated_at) VALUES('hub-test-community','hub-test-community','Hub Test Community',?,?)").run(now, now);
  sqlite.prepare("INSERT INTO community_memberships(community_id,user_id,role,status,following,joined_at) VALUES('hub-test-community',?,'member','active',1,?)").run(viewer, now);
  const post = Number(sqlite.prepare("INSERT INTO community_posts(community_id,user_id,title,body,status,created_at,updated_at) VALUES('hub-test-community',?,'Test','Community sample','published',?,?)").run(author, now, now).lastInsertRowid);
  assert.equal(feed().items.some(row => row.id === `community-${post}`), true);
  sqlite.prepare("UPDATE community_memberships SET following=0 WHERE community_id='hub-test-community' AND user_id=?").run(viewer);
  assert.equal(feed("all").items.some(row => row.id === `community-${post}`), false);
  assert.equal(storage.getHubFeed({viewerUserId:stranger,limit:50}).items.some(row => row.id === `community-${post}`), false);
});

test("resource releases retain publication time across repeated requests and require the section follow", () => {
  recordResourceRelease(sqlite, "test-release-1", "2026-10-12T08:00:00Z");
  recordResourceRelease(sqlite, "test-release-1", "2026-10-12T11:00:00Z");
  assert.equal(resourceReleaseItems(sqlite).find(row => row.id === "rezources-test-release-1")?.createdAt, "2026-10-12T08:00:00Z");
  assert.equal(feed().items.some(row => row.kind === "resource_update"), false);
  setBoardFollowing(viewer, "rezources", true);
  assert.equal(feed().items.some(row => row.kind === "resource_update"), true);
  setBoardFollowing(viewer, "rezources", false);
});

test("older posts are reachable beyond the previous forty-post candidate cap", () => {
  const ids = new Set<number>();
  for (let index = 0; index < 65; index++) ids.add(publish(`pagination-fixture-${index}`).id);
  const seen = new Set<number>(); let cursor: string | undefined;
  for (let pageNumber = 0; pageNumber < 100; pageNumber++) {
    const page = storage.getHubFeed({viewerUserId:viewer,tab:"posts",limit:10,cursor});
    for (const row of page.items) {
      const id = Number(row.id.replace("feed_post-", ""));
      if (ids.has(id)) { assert.equal(seen.has(id), false); seen.add(id); }
    }
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  assert.equal(seen.size, ids.size);
});


test("board follows preserve GIFTZ, SELLZ, and anonymous connection details without exposing blocked authors", () => {
  storage.unfollowUser(viewer,author);
  const expires = new Date(Date.now() + 86400000 * 7).toISOString();
  const gift = Number(sqlite.prepare("INSERT INTO gifting_posts(user_id,post_type,title,description,category,neighborhood,pickup_preference,photo_urls,status,expires_at,created_at) VALUES(?,'ISO','Hub ISO','Looking for boxes','Other','North','Pickup','[\"/gift.jpg\"]','OPEN',?,?)").run(stranger,expires,now).lastInsertRowid);
  const sell = Number(sqlite.prepare("INSERT INTO sellz_posts(user_id,title,description,category,condition,price_cents,neighborhood,pickup_preference,photo_urls,status,expires_at,created_at) VALUES(?,'Hub fridge','Mini fridge','Other','Good',12000,'North','Pickup','[\"/fridge.jpg\"]','ACTIVE',?,?)").run(stranger,expires,now).lastInsertRowid);
  const missed = Number(sqlite.prepare("INSERT INTO missed_connections(user_id,title,body,status,closes_at,created_at) VALUES(?,'Hub anonymous','A local connection','ACTIVE',?,?)").run(stranger,expires,now).lastInsertRowid);
  for (const board of ["giftz","sellz","mizzed"]) setBoardFollowing(viewer, board as any, true);
  const rows = feed().items;
  assert.equal(rows.find(row=>row.id===`gifting-${gift}`)?.badge,"ISO");
  assert.equal(rows.find(row=>row.id===`gifting-${gift}`)?.photoUrl,"/gift.jpg");
  assert.equal(rows.find(row=>row.id===`sellz-${sell}`)?.listing?.price,"$120");
  const connection = rows.find(row=>row.id===`spotted-${missed}`);
  assert.ok(connection?.author.anonymous);
  assert.equal(JSON.stringify(connection).includes("hub_test_stranger"),false);
  storage.blockMember(viewer,stranger);
  assert.equal(feed("all").items.some(row=>row.id===`spotted-${missed}`||row.id===`gifting-${gift}`||row.id===`sellz-${sell}`),false);
  storage.unblockMember(viewer,stranger);
  for (const board of ["giftz","sellz","mizzed"]) setBoardFollowing(viewer, board as any, false);
});

test("public beach rides follow their destination, omit private requests, and disappear on expiry", () => {
  const expires = new Date(Date.now()+86400000).toISOString();
  const date = expires.slice(0,10);
  const ride = Number(sqlite.prepare("INSERT INTO beach_carpool_posts(user_id,beach_id,post_type,departure_area,trip_date,leave_hour,seats,note,status,expires_at,created_at) VALUES(?,'rooster-rock','OFFERING_RIDE','Portland',?,10,2,'Public ride note','OPEN',?,?)").run(stranger,date,expires,now).lastInsertRowid);
  sqlite.prepare("INSERT INTO beach_carpool_requests(post_id,user_id,note,status,created_at) VALUES(?,?,'Private request note','INTERESTED',?)").run(ride,author,now);
  followOutzDestination(viewer,"rooster-rock","Rooster Rock");
  const row=feed().items.find(row=>row.id===`beach-ride-${ride}`);
  assert.equal(row?.title,"Offering a ride");
  assert.equal(row?.link,"/outzide/rooster-rock");
  assert.equal(JSON.stringify(row).includes("Private request note"),false);
  sqlite.prepare("UPDATE beach_carpool_posts SET expires_at='2000-01-01T00:00:00Z' WHERE id=?").run(ride);
  assert.equal(feed().items.some(row=>row.id===`beach-ride-${ride}`),false);
  unfollowOutzDestination(viewer,"rooster-rock");
});

test("an anonymous RSVP stays out of Hub and RSVP-only posts require attendance", () => {
  const event=storage.createEvent({title:"Hub Privacy Event",venueName:"Privacy Venue",description:"test",dateStart:"2027-03-01T20:00:00",dateEnd:"2027-03-01T23:00:00",dayOfWeek:"MON",status:"LIVE",source:"user_submitted"} as any);
  storage.setPrimaryEventHost(event.id,stranger,null);
  const post=storage.createHubFeedPost({userId:stranger,postType:"text",audience:"RSVPS",eventId:event.id,body:"Attendance-only preview",status:"LIVE"} as any);
  assert.equal(feed("posts").items.some(row=>row.id===`feed_post-${post.id}`),false);
  const person=storage.getUserById(viewer)!;
  const attendance=storage.upsertAttendance(event.id,person,"Private vibe","anonymous");
  assert.equal(feed("posts").items.some(row=>row.id===`feed_post-${post.id}`),true);
  assert.equal(feed("rsvps").items.some(row=>row.id===`rsvp-${attendance.id}`),false);
  storage.removeAttendance(event.id,viewer);
  assert.equal(feed("posts").items.some(row=>row.id===`feed_post-${post.id}`),false);
});
