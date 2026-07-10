import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
const OUT = join(process.cwd(), "script", "smoke-output-phase3");
mkdirSync(OUT, { recursive: true });

const results = [];
const errors = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

async function login(page) {
  const res = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: "tucker@test.com", password: "smoketest" },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
}

async function waitAuth(page) {
  await page.waitForResponse((r) => r.url().includes("/api/auth/me") && r.ok(), { timeout: 15000 }).catch(() => {});
}

async function overlayCount(page) {
  return page.locator(".inbox-overlay").count();
}

async function hostCount(page) {
  return page.locator(".inbox-sheet-host").count();
}

async function overlayRect(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".inbox-overlay");
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width };
  });
}

async function backdropVisible(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".inbox-overlay__backdrop");
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && s.opacity !== "0";
  });
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext();
const page = await context.newPage();
page.on("pageerror", (err) => errors.push(err.message));

try {
  await login(page);

  // Desktop
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  const unreadRes = await page
    .waitForResponse((r) => r.url().includes("/api/messages/unread-count") && r.ok(), { timeout: 15000 })
    .then((r) => r.json())
    .catch(() => ({ count: 0 }));
  await page.locator(".floating-inbox__fab").waitFor({ state: "visible", timeout: 10000 });

  const fabBadgeClosed = await page.locator(".floating-inbox__fab-badge").isVisible().catch(() => false);
  const fabBadgeText = fabBadgeClosed ? await page.locator(".floating-inbox__fab-badge").innerText() : "";
  record(
    "Desktop FAB unread badge (after unread-count loads)",
    unreadRes.count > 0 && fabBadgeClosed && fabBadgeText === String(unreadRes.count > 9 ? "9+" : unreadRes.count),
    `apiCount=${unreadRes.count} badgeVisible=${fabBadgeClosed} badgeText=${fabBadgeText}`,
  );

  record(
    "Single host, no overlay when closed (desktop)",
    (await hostCount(page)) === 1 && (await overlayCount(page)) === 0,
    `hosts=${await hostCount(page)} overlays=${await overlayCount(page)}`,
  );

  await page.locator(".floating-inbox__fab").click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  const rect = await overlayRect(page);
  const desktopBackdrop = await backdropVisible(page);
  await page.screenshot({ path: join(OUT, "01-desktop-fab-open.png"), fullPage: true });
  record(
    "Desktop FAB opens sheet bottom-right, no backdrop",
    rect && rect.right > 900 && rect.top > 80 && rect.width < 700 && !desktopBackdrop,
    `rect=${JSON.stringify(rect)} backdrop=${desktopBackdrop}`,
  );

  await page.locator(".inbox-overlay").getByText("POSTS", { exact: true }).click();
  await page.getByText("MY EVENTS").waitFor({ timeout: 5000 });
  await page.locator(".floating-inbox__fab").click();
  await page.waitForTimeout(300);
  const postsHidden = !(await page.getByText("MY EVENTS").isVisible().catch(() => false));
  await page.locator(".floating-inbox__fab").click();
  await page.waitForTimeout(300);
  const inboxHeading = await page.locator(".inbox-overlay").getByText("INBOX", { exact: true }).isVisible();
  const postsGone = !(await page.getByText("MY EVENTS").isVisible().catch(() => false));
  record(
    "Sheet tab reset on close/reopen",
    postsHidden && inboxHeading && postsGone,
    `postsHidden=${postsHidden} inboxHeading=${inboxHeading} postsGone=${postsGone}`,
  );

  await page.goto(`${BASE}/events`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  record(
    "Route change auto-dismisses sheet",
    (await overlayCount(page)) === 0,
    `url=${page.url()} overlays=${await overlayCount(page)}`,
  );

  await page.locator(".site-profile-menu__caret").click({ timeout: 10000 });
  await page.getByRole("menuitem", { name: /Inbox/i }).click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: join(OUT, "02-nav-profile-inbox.png"), fullPage: true });
  record(
    "Nav profile Inbox opens sheet (no /inbox nav)",
    !page.url().includes("/inbox") && (await overlayCount(page)) === 1,
    `url=${page.url()}`,
  );

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.locator(".hub-side__nav").getByRole("button", { name: "Inbox" }).click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: join(OUT, "03-hub-sidebar-inbox.png"), fullPage: true });
  record(
    "Hub sidebar Inbox opens sheet",
    page.url().includes("/dashboard") && (await overlayCount(page)) === 1,
    `url=${page.url()} overlays=${await overlayCount(page)}`,
  );

  record(
    "Exactly one overlay in DOM when open",
    (await hostCount(page)) === 1 && (await overlayCount(page)) === 1,
    `hosts=${await hostCount(page)} overlays=${await overlayCount(page)}`,
  );

  // Mobile site bottom nav
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  const fabHiddenMobile = !(await page.locator(".floating-inbox__fab").isVisible().catch(() => false));
  const mobileBadge = await page.locator(".site-mobile-nav__icon-badge").isVisible().catch(() => false);
  await page.locator(".site-mobile-nav").getByRole("button", { name: /Inbox/i }).click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  const mrect = await overlayRect(page);
  const mobileBackdrop = (await page.locator(".inbox-overlay__backdrop").count()) > 0;
  await page.screenshot({ path: join(OUT, "04-mobile-bottom-sheet.png"), fullPage: true });
  record(
    "Mobile bottom-nav opens sheet with backdrop",
    fabHiddenMobile && mobileBackdrop && mrect && mrect.bottom > 500,
    `fabHidden=${fabHiddenMobile} backdropEl=${mobileBackdrop} rect=${JSON.stringify(mrect)} badge=${mobileBadge}`,
  );

  // Hub mobile inbox
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.locator(".hub-mobile-bar").waitFor({ state: "visible", timeout: 10000 });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll(".hub-mobile-bar button")].find((b) =>
      b.textContent?.includes("Inbox"),
    );
    btn?.click();
  });
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: join(OUT, "05-hub-mobile-inbox.png"), fullPage: true });
  record(
    "Hub mobile Inbox opens sheet",
    page.url().includes("/dashboard") && (await overlayCount(page)) === 1,
    `url=${page.url()}`,
  );
} catch (err) {
  record("Smoke harness", false, err.message);
  await page.screenshot({ path: join(OUT, "error.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

const summary = { base: BASE, screenshots: OUT, errors, results, allPass: results.every((r) => r.ok) };
console.log("\n=== PHASE 3 SMOKE SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.allPass ? 0 : 1);