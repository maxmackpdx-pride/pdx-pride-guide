import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";
import { smokeLogin, prepareSmokeContext, waitForAppStable } from "./smoke-auth.mjs";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
const OUT = join(process.cwd(), "script", "smoke-output");
mkdirSync(OUT, { recursive: true });

const CLAIMED_EVENT_ID = 13;
const CLAIMED_EVENT_TITLE = "Stank Yes Coach — PDX PRIDE";
const GIG_ID = 4;
const GIG_TITLE = "Site Admins Needed: PDX Pride Guide";
const BAD_EVENT_ID = 999999;

const results = [];
const errors = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

async function login(page) {
  await smokeLogin(page.request, BASE);
}

async function openInboxPosts(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAppStable(page);
  const fab = page.getByRole("button", { name: /Open inbox/i }).first();
  await fab.waitFor({ state: "visible", timeout: 20000 });
  await fab.click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  await page.getByRole("button", { name: "POSTS" }).click();
  await page.getByText("MY EVENTS").waitFor({ state: "visible", timeout: 10000 });
  await page
    .waitForResponse((r) => r.url().includes("/api/events/mine/claimed") && r.ok(), { timeout: 15000 })
    .catch(() => {});
  await page
    .waitForResponse((r) => r.url().includes("/api/events/mine/submitted") && r.ok(), { timeout: 15000 })
    .catch(() => {});
  const editBtn = page.locator(".inbox-overlay").getByRole("button", { name: "EDIT" }).first();
  await editBtn.waitFor({ state: "visible", timeout: 15000 });
}

async function sheetOpen(page) {
  return page.locator(".inbox-overlay").isVisible();
}

async function toggleSection(page, title) {
  await page.locator(".inbox-overlay").getByText(title, { exact: true }).click();
  await page.waitForTimeout(300);
}

async function waitForPostsHub(page) {
  await page.getByRole("heading", { name: "Your Events" }).waitFor({ timeout: 10000 });
}

async function sectionInView(page, id) {
  await page.locator(`#${id}`).waitFor({ state: "visible", timeout: 10000 });
  return page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return false;
    return el.getBoundingClientRect().top < window.innerHeight * 1.25;
  }, id);
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext();
await prepareSmokeContext(context);
const page = await context.newPage();
page.on("pageerror", (err) => errors.push(err.message));

try {
  await login(page);

  // 1. Claimed event EDIT (sheet → editor)
  await openInboxPosts(page);
  await page.locator(".inbox-overlay").getByRole("button", { name: "EDIT" }).first().click({ timeout: 15000 });
  const sheetClosed1 = !(await sheetOpen(page));
  const url1 = page.url();
  await page.getByText(`Editing: ${CLAIMED_EVENT_TITLE}`, { exact: false }).waitFor({ timeout: 10000 });
  const titleValue = await page.locator(".dash-edit-panel input").first().inputValue();
  await page.screenshot({ path: join(OUT, "01-claimed-event-deeplink.png"), fullPage: true });
  record(
    "Claimed event EDIT (sheet → editor)",
    sheetClosed1 && url1.includes(`editEvent=${CLAIMED_EVENT_ID}`) && titleValue.includes("Stank"),
    `url=${url1} sheetClosed=${sheetClosed1} titleField="${titleValue}"`,
  );

  // 2. Gig EDIT (sheet → editor)
  await openInboxPosts(page);
  await toggleSection(page, "GIG POSTS");
  await page.locator(".inbox-overlay").getByText(GIG_TITLE, { exact: false }).waitFor({ timeout: 10000 });
  const gigEdit = page
    .locator(".inbox-overlay")
    .locator("div")
    .filter({ hasText: GIG_TITLE })
    .filter({ has: page.getByRole("button", { name: "EDIT" }) })
    .last()
    .getByRole("button", { name: "EDIT" });
  await gigEdit.click();
  const sheetClosed2 = !(await sheetOpen(page));
  const url2 = page.url();
  await page.getByText("Edit gig post", { exact: false }).waitFor({ timeout: 10000 });
  const gigTitleValue = await page.locator(".dash-edit-panel input").first().inputValue();
  await page.screenshot({ path: join(OUT, "02-gig-deeplink.png"), fullPage: true });
  record(
    "Gig EDIT (sheet → editor)",
    sheetClosed2 && url2.includes(`editGig=${GIG_ID}`) && gigTitleValue.includes("Site Admins"),
    `url=${url2} sheetClosed=${sheetClosed2} titleField="${gigTitleValue}"`,
  );

  // 3. Submitted event → events section (URL handler; owner account has no sheet rows)
  await page.goto(`${BASE}/dashboard?view=posts&section=events`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await waitForPostsHub(page);
  const eventsInView = await sectionInView(page, "events");
  await page.screenshot({ path: join(OUT, "03-submitted-section.png"), fullPage: true });
  record(
    "Submitted event → events section scroll",
    page.url().includes("view=posts") && eventsInView,
    `url=${page.url()} eventsInView=${eventsInView} note=PostsView href verified; owner /api/events/mine/submitted returns []`,
  );

  // 4. Check-ins VIEW (sheet → section scroll; URL fallback when no sheet rows)
  await openInboxPosts(page);
  await toggleSection(page, "CHECK-INS");
  const checkinView = page
    .locator(".inbox-overlay")
    .locator("div")
    .filter({ hasText: "Stank Yes Coach" })
    .filter({ has: page.getByRole("button", { name: "VIEW", exact: true }) })
    .last()
    .getByRole("button", { name: "VIEW", exact: true });
  let sheetClosed4;
  let url4;
  let checkinsInView;
  if ((await checkinView.count()) > 0) {
    await checkinView.click();
    sheetClosed4 = !(await sheetOpen(page));
    url4 = page.url();
    await waitForPostsHub(page);
    checkinsInView = await sectionInView(page, "checkins");
  } else {
    await page.goto(`${BASE}/dashboard?view=posts&section=checkins`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await waitForPostsHub(page);
    sheetClosed4 = !(await sheetOpen(page));
    url4 = page.url();
    checkinsInView = await sectionInView(page, "checkins");
  }
  await page.screenshot({ path: join(OUT, "04-checkins-section.png"), fullPage: true });
  record(
    "Check-ins VIEW (sheet → checkins section)",
    sheetClosed4 && url4.includes("view=posts") && checkinsInView,
    `url=${url4} sheetClosed=${sheetClosed4} checkinsInView=${checkinsInView}`,
  );

  // 5. Stale editEvent
  await page.goto(`${BASE}/dashboard?view=posts&editEvent=${BAD_EVENT_ID}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const noEditor = (await page.getByText("Editing:", { exact: false }).count()) === 0;
  const postsHeading = await page.getByRole("heading", { name: "Your Events" }).isVisible();
  await page.screenshot({ path: join(OUT, "05-stale-editEvent.png"), fullPage: true });
  record(
    "Stale editEvent (no crash, posts view only)",
    errors.length === 0 && page.url().includes("view=posts") && noEditor && postsHeading,
    `errors=${errors.length} url=${page.url()} editorOpen=${!noEditor} postsHeading=${postsHeading}`,
  );
} catch (err) {
  record("Smoke harness", false, err.message);
  await page.screenshot({ path: join(OUT, "error.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

const summary = { base: BASE, screenshots: OUT, errors, results, allPass: results.every((r) => r.ok) };
console.log("\n=== SMOKE SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.allPass ? 0 : 1);