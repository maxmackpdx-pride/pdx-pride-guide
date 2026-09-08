import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import { majorOutzAlerts } from "./outzFeedWeather";
import { beachCheckinDateOptions } from "@shared/riverBrats";
import type { OutzSnapshot } from "@shared/outz";
mkdirSync(".local", { recursive: true });
const dir = mkdtempSync(path.resolve(".local/outz-feed-test-"));
process.env.DATABASE_PATH = path.join(dir, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite, storage } = await import("./storage");
const { getOutzCommunityFeed } = await import("./outzFeed");
after(() => { sqlite.close(); rmSync(dir, { recursive: true, force: true }); });
const now = Date.now(), created = new Date(now).toISOString(), expires = new Date(now + 86400_000).toISOString();
const date = beachCheckinDateOptions(now)[1];
const user = (n: string) => Number(sqlite.prepare("INSERT INTO users(username,email,password_hash) VALUES(?,?,?)").run(`feed_${n}`,`feed_${n}@example.test`,"test-only").lastInsertRowid);
const viewer = user("viewer"), author = user("author"), hidden = user("hidden");
const snapshot = { destinations: [], catalog: [{ id: "feed-trail", name: "Feed trail", kind: "trailhead", lat: 45, lng: -122 }], communityStays: [], sources: [], fetchedAt: created } as unknown as OutzSnapshot;
test("major alerts exclude expired, test, cancelled and minor notices, and deduplicate", () => {
  const p = { id: "alert-id", headline: "High Wind Warning", event: "High Wind Warning", severity: "Severe", status: "Actual", expires, sent: created };
  const result = majorOutzAlerts([{ properties:p },{ properties:p },{properties:{...p,id:"expired",expires:created}},
    {properties:{...p,id:"test",status:"Test"}},{properties:{...p,id:"cancel",messageType:"Cancel"}},
    {properties:{...p,id:"minor",event:"Wind Advisory",severity:"Minor"}},{properties:{...p,id:"unknown-expiry",expires:"invalid"}}],now);
  assert.equal(result.length,1); assert.equal(result[0].kind,"weather"); assert.match(result[0].href,/alerts.weather.gov/);
});
test("feed respects blocks, aggregates check-ins without identities, and excludes old rides", () => {
  storage.blockMember(viewer,hidden);
  const post=sqlite.prepare("INSERT INTO outz_wall_posts(place_id,user_id,post_kind,body,trip_date,created_at) VALUES(?,?,?,?,?,?)");
  post.run("feed-trail",author,"TRIP_NOTE","Useful public note",null,created);
  post.run("feed-trail",hidden,"TRIP_NOTE","Blocked post",null,created);
  post.run("feed-trail",author,"CARPOOL","Past ride","2000-01-01",created);
  post.run("unknown-place",author,"TRIP_NOTE","Unknown destination",null,created);
  const checkin=sqlite.prepare("INSERT INTO outz_checkins(user_id,place_id,arrival_hour,depart_hour,note,calendar_date,is_anonymous,is_active,expires_at,created_at) VALUES(?,'feed-trail',10,13,'PRIVATE NOTE',?,1,1,?,?)");
  checkin.run(author,date,expires,created);checkin.run(hidden,date,expires,created);
  const ride=sqlite.prepare("INSERT INTO beach_carpool_posts(user_id,beach_id,post_type,departure_area,trip_date,leave_hour,note,status,expires_at,created_at) VALUES(?,'rooster-rock','OFFERING_RIDE','Portland',?,10,'Ride note','OPEN',?,?)");
  ride.run(author,date,expires,created);
  ride.run(hidden,date,expires,created);
  const result=getOutzCommunityFeed(snapshot,viewer,now);
  assert.equal(result.filter(i=>i.kind==='post').length,1);
  const visits=result.filter(i=>i.kind==='checkin');assert.equal(visits.length,1);assert.match(visits[0].title,/^1 person/);
  assert.ok(!JSON.stringify(visits).includes('PRIVATE NOTE'));assert.ok(!JSON.stringify(visits).includes('user_id'));assert.equal(visits[0].author,undefined);
  assert.equal(result.filter(i=>i.kind==='carpool').length,1);assert.equal(result.find(i=>i.kind==='carpool')?.title,'Offering a ride');
  assert.ok(!JSON.stringify(result).includes('Blocked post'));assert.ok(!JSON.stringify(result).includes('Past ride'));
});
