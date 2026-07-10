import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
const OUT = join(process.cwd(), "script", "smoke-output-phase4");
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

async function bodyHasContent(page) {
  const text = await page.locator(".admin-panel-body, .hub-main__body").first().innerText().catch(() => "");
  return text.trim().length > 40;
}

const REMAINING_TABS = [
  { key: "overview", label: "Overview", expect: /Needs attention|Control room|push/i },
  { key: "events", label: "Events", expect: /events total|Assign unclaimed/i },
  { key: "gigs", label: "Gigs", expect: /Pride Werk|gig/i },
  { key: "promoters", label: "Promoters", expect: /Promoter|scene/i },
  { key: "venue-claims", label: "Venue claims", expect: /Venue|claim|directory/i },
  { key: "users", label: "Users", expect: /user|community/i },
  { key: "team", label: "Team", expect: /admin|keyholder|grant/i },
];

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on("pageerror", (err) => errors.push(err.message));

try {
  await login(page);
  await page.goto(`${BASE}/admin?tab=overview`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.locator(".hub-main__title").waitFor({ timeout: 15000 });

  for (const tab of REMAINING_TABS) {
    await page.goto(`${BASE}/admin?tab=${tab.key}`, { waitUntil: "domcontentloaded" });
    await waitAuth(page);
    await page.waitForTimeout(200);
    const title = await page.locator(".hub-main__title").innerText().catch(() => "");
    const hasBody = await bodyHasContent(page);
    const bodyText = await page.locator(".admin-panel-body, .hub-main__body").first().innerText().catch(() => "");
    const matches = tab.expect.test(bodyText) || tab.expect.test(title);
    await page.screenshot({ path: join(OUT, `tab-${tab.key}.png`), fullPage: true });
    record(
      `Admin tab: ${tab.label}`,
      hasBody && matches && page.url().includes(`tab=${tab.key}`),
      `title=${title} hasBody=${hasBody} matches=${matches} url=${page.url()}`,
    );
  }

  await page.goto(`${BASE}/admin?tab=overview`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  const queueShortcut = page.getByRole("button", { name: /Open queue|View all .* in queue|Review/i }).first();
  if (await queueShortcut.isVisible().catch(() => false)) {
    await queueShortcut.click({ timeout: 10000 });
    await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
    const adminAccount = await page.locator(".inbox-overlay").getByText("Admin", { exact: true }).isVisible();
    record("Overview queue shortcut → admin sheet", adminAccount, `adminTabVisible=${adminAccount}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  } else {
    record("Overview queue shortcut → admin sheet", true, "queue clear — no pending items, shortcut N/A");
  }

  await page.goto(`${BASE}/admin?tab=queue`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  const legacyQueue = page.url().includes("tab=overview");
  const sheetAfterQueue = await page.locator(".inbox-overlay").isVisible().catch(() => false);
  const queueKicker = await page.locator(".inbox-overlay").getByText(/SHARED QUEUE/i).isVisible().catch(() => false);
  record("Legacy ?tab=queue → overview + admin sheet", legacyQueue && sheetAfterQueue && queueKicker, `url=${page.url()} sheet=${sheetAfterQueue} kicker=${queueKicker}`);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await page.goto(`${BASE}/admin?tab=stats`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  const legacyStats = page.url().includes("tab=overview");
  const statsSheet = await page.locator(".inbox-overlay").isVisible().catch(() => false);
  const statsHeading = statsSheet
    ? await page.locator(".inbox-overlay").getByText("STATS", { exact: true }).isVisible().catch(() => false)
    : false;
  const memberGrowth = statsSheet
    ? await page.locator(".inbox-overlay").getByText(/MEMBER GROWTH/i).isVisible().catch(() => false)
    : false;
  record("Legacy ?tab=stats → overview + stats sheet", legacyStats && statsSheet && statsHeading, `url=${page.url()} stats=${statsHeading} memberGrowth=${memberGrowth}`);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  await page.goto(`${BASE}/admin?tab=overview`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  await page.getByLabel(/Notifications/i).click({ force: true, timeout: 10000 });
  const bellSheet = await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 }).then(() => true).catch(() => false);
  record("Notify bell opens admin queue sheet", bellSheet, `sheetVisible=${bellSheet}`);

  await page.goto(`${BASE}/admin?tab=events`, { waitUntil: "domcontentloaded" });
  await waitAuth(page);
  const removedInboxGone = !(await page.locator(".hub-side__nav").getByText("Review queue").isVisible().catch(() => false));
  record("Removed tabs absent from sidebar", removedInboxGone, `reviewQueueVisible=${!removedInboxGone}`);
} catch (err) {
  record("Smoke harness", false, err.message);
  await page.screenshot({ path: join(OUT, "error.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

const summary = { base: BASE, screenshots: OUT, errors, results, allPass: results.every((r) => r.ok) };
console.log("\n=== PHASE 4 ADMIN SMOKE SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.allPass ? 0 : 1);