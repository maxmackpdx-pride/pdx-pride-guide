import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

// Exercise the actual route handlers and SQL with synthetic users in a disposable seed copy.
mkdirSync(".local", { recursive: true });
const directory = mkdtempSync(path.resolve(".local/community-permissions-"));
process.env.DATABASE_PATH = path.join(directory, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { sqlite } = await import("./storage");
const { registerCommunityRoutes, communityRelationshipFromUrl, linkQSearchCommunityEvent } = await import("./communities");
const { createOutzWallPost, createOutzWallComment, updateOutzWallPost, deleteOutzWallPost } = await import("./outzSocial");
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

const routes = new Map<string, Function[]>();
const app: any = {};
for (const method of ["get", "post", "put", "patch", "delete"]) app[method] = (route: string, ...handlers: Function[]) => routes.set(`${method} ${route}`, handlers);
registerCommunityRoutes(app, ((req: any, res: any, next: Function) => req.session.userId ? next() : res.status(401).json({ error: "Sign in" })) as any);
function call(method: string, route: string, userId?: number, body: any = {}, params: any = {}) {
  let status = 200, result: any;
  const res: any = { status(code: number) { status = code; return res; }, json(value: any) { result = value; return res; }, end() {} };
  const handlers = routes.get(`${method} ${route}`)!;
  assert.ok(handlers, route);
  let index = 0;
  const next = () => handlers[index++]?.({ session: { userId }, body, params }, res, next);
  next();
  return { status, result };
}
function user(name: string) { return Number(sqlite.prepare("INSERT INTO users (username,email,password_hash) VALUES (?,?,?)").run(`test_${name}`,`${name}@permissions.test`, "not-a-password").lastInsertRowid); }
const owner = user("owner"), author = user("author"), outsider = user("outsider");
const community = call("post", "/api/communities", owner, { name: "Permissions Test Community", description: "Synthetic community to exercise reply protections" }).result;
const params = { slug: community.slug };
call("post", "/api/communities/:slug/join", author, {}, params);
const parent = call("post", "/api/communities/:slug/posts", owner, { body: "Plan a community picnic" }, params).result.posts[0];
const parentParams = { ...params, postId: parent.id };

test("joining follows the feed by default; members can mute and resume", () => {
  assert.equal(call("get", "/api/communities/:slug", author, {}, params).result.viewerFollowing, true);
  const endpoint="/api/communities/:slug/follow";
  assert.equal(call("put", endpoint, outsider, {following:false}, params).status, 403);
  assert.equal(call("put", endpoint, author, {following:false}, params).status, 200);
  assert.equal(call("get", "/api/communities/:slug", author, {}, params).result.viewerFollowing, false);
  assert.equal(call("put", endpoint, author, {following:true}, params).result.viewerFollowing, true);
});

test("RedGIFs media is stored; unsafe hosts are rejected", () => {
  const created=call("post", "/api/communities/:slug/posts", author, {title:"Weekend photos",mediaUrl:"https://redgifs.com/watch/SampleClip?ref=feed"}, params);
  assert.equal(created.status, 201);
  const id=created.result.posts[0].id;
  assert.equal(created.result.posts[0].mediaUrl, "https://www.redgifs.com/watch/SampleClip");
  assert.equal(call("patch", "/api/communities/:slug/posts/:postId", author, {title:"Changed",body:"",mediaUrl:"https://redgifs.com.evil.test/watch/SampleClip"}, {...params,postId:id}).status, 400);
  call("delete", "/api/communities/:slug/posts/:postId", author, {}, {...params,postId:id});
});

test("public group events appear for visitors in upcoming and past tabs", () => {
  const groupId=Number(sqlite.prepare("INSERT INTO businesses (name,type,description,active) VALUES ('Community Event Group','group','Synthetic group',1)").run().lastInsertRowid);
  const group=call("post", "/api/communities", owner, {name:"Community Event Test",description:"A community with group hosted events"}).result;
  sqlite.prepare("UPDATE communities SET source_business_id=? WHERE id=?").run(groupId,group.id);
  const insert=sqlite.prepare("INSERT INTO events (title,description,venue_name,date_start,date_end,status,is_public,is_private) VALUES (?,?,?,?,?,'LIVE',1,0)");
  const future=new Date(Date.now()+7*86400000).toISOString(),past=new Date(Date.now()-7*86400000).toISOString();
  const futureId=Number(insert.run("Upcoming gathering","Test","Other venue",future,future).lastInsertRowid);
  const pastId=Number(insert.run("Past gathering","Test","Other venue",past,past).lastInsertRowid);
  linkQSearchCommunityEvent(futureId,[{businessId:groupId,role:"venue"}]);
  assert.equal(call("get", "/api/communities/:slug", undefined, {}, {slug:group.slug}).result.events.upcoming.length,0);
  linkQSearchCommunityEvent(futureId,[{businessId:groupId,role:"group"}]);
  linkQSearchCommunityEvent(pastId,[{businessId:groupId,role:"group"}]);
  const events=call("get", "/api/communities/:slug", undefined, {}, {slug:group.slug}).result.events;
  assert.deepEqual(events.upcoming.map((event:any)=>event.id),[futureId]);
  assert.deepEqual(events.past.map((event:any)=>event.id),[pastId]);
});

test("votes persist per member and respect community and post boundaries", () => {
  const endpoint = "/api/communities/:slug/posts/:postId/vote";
  assert.equal(call("put", endpoint, undefined, { value: 1 }, parentParams).status, 401);
  assert.equal(call("put", endpoint, outsider, { value: 1 }, parentParams).status, 403);
  assert.equal(call("put", endpoint, author, { value: 2 }, parentParams).status, 400);
  assert.equal(call("put", endpoint, author, { value: 1 }, parentParams).status, 200);
  assert.equal(call("get", "/api/communities/:slug", author, {}, params).result.posts[0].score, 1);
  assert.equal(call("put", endpoint, author, { value: -1 }, parentParams).status, 200);
  const voted = call("get", "/api/communities/:slug", author, {}, params).result.posts[0];
  assert.equal(voted.score, -1);
  assert.equal(voted.viewerVote, -1);
  assert.equal(call("get", "/api/communities/:slug", owner, {}, params).result.posts[0].viewerVote, 0);
  const other = call("post", "/api/communities", author, { name: "Vote Boundary Community", description: "A separate community for vote boundaries" }).result;
  assert.equal(call("put", endpoint, author, { value: 1 }, { slug: other.slug, postId: parent.id }).status, 404);
  assert.equal(call("put", endpoint, author, { value: 0 }, parentParams).status, 200);
  assert.equal(call("get", "/api/communities/:slug", author, {}, params).result.posts[0].score, 0);
});

test("titled posts retain their title while legacy body-only posts remain readable", () => {
  const other = call("post", "/api/communities", author, { name: "Title Test Community", description: "A separate community for title behavior" }).result;
  const created = call("post", "/api/communities/:slug/posts", author, { title: "Picnic details", body: "Bring a blanket" }, { slug: other.slug });
  assert.equal(created.status, 201);
  assert.equal(created.result.posts[0].title, "Picnic details");
  assert.equal(created.result.posts[0].body, "Bring a blanket");
  assert.equal(call("get", "/api/communities/:slug", owner, {}, params).result.posts.find((post: any) => post.id === parent.id).title, "");
});

test("replies require sign-in and active membership; cannot cross communities or nest under replies", () => {
  const endpoint = "/api/communities/:slug/posts/:postId/replies";
  assert.equal(call("post", endpoint, undefined, { body: "hello" }, parentParams).status, 401);
  assert.equal(call("post", endpoint, outsider, { body: "hello" }, parentParams).status, 403);
  const posted = call("post", endpoint, author, { body: "I can bring lunch" }, parentParams);
  assert.equal(posted.status, 201);
  const reply = posted.result.posts[0].replies[0];
  assert.equal(reply.body, "I can bring lunch");
  assert.equal(call("post", endpoint, author, { body: "Nested" }, { ...params, postId: reply.id }).status, 404);
  const other = call("post", "/api/communities", author, { name: "Different Community", description: "A separate membership boundary" }).result;
  assert.equal(call("post", endpoint, author, { body: "Wrong community" }, { slug: other.slug, postId: parent.id }).status, 404);
  assert.equal(call("patch", "/api/communities/:slug/posts/:postId", owner, { body: "Overwrite" }, { ...params, postId: reply.id }).status, 403);
  assert.equal(call("patch", "/api/communities/:slug/posts/:postId", author, { body: "I can bring tea" }, { ...params, postId: reply.id }).status, 200);
  assert.equal(call("post", "/api/communities/:slug/posts/:postId/report", owner, { reason: "Test report for moderators" }, { ...params, postId: reply.id }).status, 201);
  assert.equal(call("delete", "/api/communities/:slug/posts/:postId", outsider, {}, { ...params, postId: reply.id }).status, 403);
  assert.equal(call("delete", "/api/communities/:slug/posts/:postId", owner, {}, { ...params, postId: reply.id }).status, 204);
  assert.equal(call("get", "/api/communities/:slug", author, {}, params).result.posts[0].replies.length, 0);
});

test("private community content and mutations remain inaccessible to outsiders and departed authors", () => {
  const reply = call("post", "/api/communities/:slug/posts/:postId/replies", author, { body: "Private plans" }, parentParams).result.posts[0].replies[0];
  call("patch", "/api/communities/:slug", owner, { visibility: "private" }, params);
  assert.equal(call("get", "/api/communities/:slug", outsider, {}, params).status, 404);
  assert.equal(call("post", "/api/communities/:slug/posts/:postId/replies", outsider, { body: "Guess" }, parentParams).status, 404);
  assert.equal(call("post", "/api/communities/:slug/posts/:postId/report", outsider, { reason: "Guessing a private id" }, { ...params, postId: reply.id }).status, 404);
  call("delete", "/api/communities/:slug/membership", author, {}, params);
  assert.equal(call("patch", "/api/communities/:slug/posts/:postId", author, { body: "After leaving" }, { ...params, postId: reply.id }).status, 404);
  assert.equal(call("delete", "/api/communities/:slug/posts/:postId", author, {}, { ...params, postId: reply.id }).status, 404);
  // Repeated joins must not demote owners and bypass transfer requirements.
  assert.equal(call("post", "/api/communities/:slug/join", owner, {}, params).result.viewerRole, "owner");
  assert.equal(call("delete", "/api/communities/:slug/membership", owner, {}, params).status, 409);
});

test("related links accept public Zaylist object URLs and reject external or executable routes", () => {
  assert.deepEqual(communityRelationshipFromUrl("https://www.zaylist.com/event/123/dance"), { targetType: "event", targetId: "123" });
  assert.deepEqual(communityRelationshipFromUrl("/directory/4/place"), { targetType: "place", targetId: "4" });
  assert.deepEqual(communityRelationshipFromUrl("/sellz?post=9"), { targetType: "sellz", targetId: "9" });
  for (const value of ["javascript:alert(1)", "https://evil.test/event/1/a", "//evil.test/event/1/a", "/admin", "/api/users", "https://evil@www.zaylist.com/event/1/a"]) assert.equal(communityRelationshipFromUrl(value), null);
});

test("destination wall edits and deletion enforce ownership and deletion removes child comments", () => {
  const post = createOutzWallPost({ placeId: "test-silver-falls", userId: author, postKind: "TRIP_NOTE", body: "Initial trail plan", tripDate: null });
  createOutzWallComment({ postId: post.id, userId: owner, body: "Meet there" });
  assert.equal(updateOutzWallPost(post.id, outsider, "Hijacked"), false);
  assert.equal(deleteOutzWallPost(post.id, outsider), false);
  assert.equal(sqlite.prepare("SELECT body FROM outz_wall_posts WHERE id=?").get(post.id)?.body, "Initial trail plan");
  assert.equal(updateOutzWallPost(post.id, author, "Changed trail plan"), true);
  assert.equal(sqlite.prepare("SELECT body FROM outz_wall_posts WHERE id=?").get(post.id)?.body, "Changed trail plan");
  assert.equal(deleteOutzWallPost(post.id, author), true);
  assert.equal(sqlite.prepare("SELECT COUNT(*) n FROM outz_wall_comments WHERE post_id=?").get(post.id)?.n, 0);
  assert.equal(updateOutzWallPost(post.id, author, "Revive"), false);
});
