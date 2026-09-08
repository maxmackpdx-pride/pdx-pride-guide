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
const { registerCommunityRoutes, communityRelationshipFromUrl } = await import("./communities");
const { createOutzWallPost, createOutzWallComment, updateOutzWallPost, deleteOutzWallPost } = await import("./outzSocial");
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

const routes = new Map<string, Function[]>();
const app: any = {};
for (const method of ["get", "post", "patch", "delete"]) app[method] = (route: string, ...handlers: Function[]) => routes.set(`${method} ${route}`, handlers);
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
