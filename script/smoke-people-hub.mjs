import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";
import { smokeLogin, prepareSmokeContext } from "./smoke-auth.mjs";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
const OUT = join(process.cwd(), "script", "smoke-output-people");
mkdirSync(OUT, { recursive: true });

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

async function ensureSession(request) {
  try {
    await smokeLogin(request, BASE);
    return "login";
  } catch {
    /* fall through to register */
  }

  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const register = await request.post(`${BASE}/api/auth/register`, {
    data: {
      username: `smokepeople${stamp}`,
      email: `smokepeople${stamp}@test.local`,
      password: "smoketest",
      displayName: "Smoke People",
    },
  });
  if (!register.ok()) throw new Error(`Auth failed: ${register.status()} ${await register.text()}`);
  return "register";
}

function hasPeopleShape(list) {
  if (!Array.isArray(list)) return false;
  return list.every(
    (p) =>
      typeof p.id === "number"
      && typeof p.username === "string"
      && typeof p.followers === "number"
      && typeof p.isFollowing === "boolean"
      && typeof p.verifiedHost === "boolean",
  );
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext();
await prepareSmokeContext(context);
const page = await context.newPage();

try {
  // Unauthenticated gates
  const anonStats = await page.request.get(`${BASE}/api/users/me/follow-stats`);
  record("follow-stats requires auth", anonStats.status() === 401, `status=${anonStats.status()}`);

  const anonPeople = await page.request.get(`${BASE}/api/users/me/people/following`);
  record("people list requires auth", anonPeople.status() === 401, `status=${anonPeople.status()}`);

  const authMode = await ensureSession(page.request);
  record("authenticated session", true, authMode);

  const statsRes = await page.request.get(`${BASE}/api/users/me/follow-stats`);
  const stats = await statsRes.json();
  record(
    "follow-stats returns counts",
    statsRes.ok() && typeof stats.followers === "number" && typeof stats.following === "number",
    JSON.stringify(stats),
  );

  for (const tab of ["following", "followers", "discover"]) {
    const res = await page.request.get(`${BASE}/api/users/me/people/${tab}`);
    const list = await res.json();
    record(
      `people/${tab} returns array`,
      res.ok() && hasPeopleShape(list),
      `count=${Array.isArray(list) ? list.length : "invalid"}`,
    );
  }

  const badTab = await page.request.get(`${BASE}/api/users/me/people/nope`);
  record("invalid people tab is 400", badTab.status() === 400, `status=${badTab.status()}`);

  // Follow round-trip on first discover suggestion (if any)
  const discoverRes = await page.request.get(`${BASE}/api/users/me/people/discover`);
  const discover = await discoverRes.json();
  if (Array.isArray(discover) && discover.length > 0) {
    const target = discover[0];
    const followRes = await page.request.post(`${BASE}/api/users/${encodeURIComponent(target.username)}/follow`);
    const followBody = await followRes.json();
    record("follow from discover", followRes.ok() && followBody.isFollowing === true, `@${target.username}`);

    const followingRes = await page.request.get(`${BASE}/api/users/me/people/following`);
    const following = await followingRes.json();
    const listed = following.some((p) => p.username === target.username && p.isFollowing);
    record("following list includes new follow", listed, `followingCount=${following.length}`);

    const unfollowRes = await page.request.delete(`${BASE}/api/users/${encodeURIComponent(target.username)}/follow`);
    const unfollowBody = await unfollowRes.json();
    record("unfollow cleanup", unfollowRes.ok() && unfollowBody.isFollowing === false, `@${target.username}`);
  } else {
    record("follow round-trip", true, "skipped — discover list empty");
  }

  // UI: People hub section
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/dashboard?section=people`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForResponse((r) => r.url().includes("/api/auth/me") && r.ok(), { timeout: 15000 }).catch(() => {});

  const hasPeopleHeading = await page.getByRole("heading", { name: "People" }).isVisible();
  const hasFollowingTab = await page.getByRole("button", { name: "Following" }).isVisible();
  const hasFollowersTab = await page.getByRole("button", { name: "Followers" }).isVisible();
  const hasDiscoverTab = await page.getByRole("button", { name: "Discover" }).isVisible();
  const staleCopy = await page.getByText(/not live yet|hub list not live/i).count();
  record(
    "People hub UI renders tabs",
    hasPeopleHeading && hasFollowingTab && hasFollowersTab && hasDiscoverTab && staleCopy === 0,
    `staleCopy=${staleCopy}`,
  );

  await page.getByRole("button", { name: "Discover" }).click();
  await page.waitForResponse((r) => r.url().includes("/api/users/me/people/discover") && r.ok(), { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400);

  const rowCount = await page.locator(".hub-thread").count();
  const emptyTitle = await page.getByText(/Your following list is empty|No suggestions right now|No followers yet/i).count();
  record("Discover tab loads list or empty state", rowCount > 0 || emptyTitle > 0, `rows=${rowCount} empty=${emptyTitle}`);

  await page.screenshot({ path: join(OUT, "people-discover.png"), fullPage: true });

  const railText = await page.getByText("Who to follow").count();
  record("Right rail who-to-follow present", railText > 0, `matches=${railText}`);

  const failed = results.filter((r) => !r.ok);
  console.log("\n--- SUMMARY ---");
  console.log(`${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("Failures:", failed);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}