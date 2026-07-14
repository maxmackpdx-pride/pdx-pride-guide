import { chromium, request as playwrightRequest } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";
import { smokeLogin, prepareSmokeContext, waitForAppStable } from "./smoke-auth.mjs";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:5050";
const OUT = join(process.cwd(), "script", "smoke-output-admin-queue");
mkdirSync(OUT, { recursive: true });

const results = [];
const errors = [];
const ts = Date.now();
const APPLICANT_EMAIL = `pw-promo-${ts}@test.com`;
const APPLICANT_USER = `pw${ts}`;
const APPLICANT_NAME = `PW Applicant ${ts}`;
const PITCH = `Playwright promoter pitch ${ts}`;
const SPOT_TITLE = `Spotted PW Event ${ts}`;

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}: ${detail}`);
}

async function loginAdmin(page) {
  await smokeLogin(page.request, BASE);
}

async function seedPromoterApplication(api) {
  const reg = await api.post(`${BASE}/api/auth/register`, {
    data: {
      username: APPLICANT_USER,
      email: APPLICANT_EMAIL,
      password: "testpass123",
      displayName: APPLICANT_NAME,
    },
  });
  if (!reg.ok()) throw new Error(`Register failed: ${reg.status()} ${await reg.text()}`);

  const submit = await api.post(`${BASE}/api/submit`, {
    data: {
      type: "PROMOTER_APPLICATION",
      claimReason: PITCH,
      submitterOrg: "PW Test Org",
    },
  });
  if (!submit.ok()) throw new Error(`Submit failed: ${submit.status()} ${await submit.text()}`);

  const suggest = await api.post(`${BASE}/api/submit`, {
    data: {
      type: "SUGGEST",
      title: SPOT_TITLE,
      description: "Saw it in the park",
      venueName: "Park",
      dateStart: "2026-06-15T18:00:00-07:00",
      dateEnd: "2026-06-15T21:00:00-07:00",
      dayOfWeek: "MON",
      eventTypes: "[]",
    },
  });
  if (!suggest.ok()) throw new Error(`Suggest failed: ${suggest.status()} ${await suggest.text()}`);

  return submit.json();
}

async function openAdminQueue(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForAppStable(page);
  await page.locator(".floating-inbox__fab").waitFor({ state: "visible", timeout: 20000 });
  await page.locator(".floating-inbox__fab").click();
  await page.locator(".inbox-overlay").waitFor({ state: "visible", timeout: 10000 });
  await page
    .waitForResponse((r) => r.url().includes("/api/admin/pending-count") && r.ok(), { timeout: 15000 })
    .catch(() => {});
  const adminTab = page.locator(".inbox-overlay").getByRole("button", { name: /^Admin/i });
  if (await adminTab.isVisible().catch(() => false)) {
    const alreadyActive = await adminTab.evaluate((el) => el.classList.contains("is-active")).catch(() => false);
    if (!alreadyActive) await adminTab.click();
  }
  await page
    .waitForResponse((r) => r.url().includes("/api/admin/queue") && r.ok(), { timeout: 15000 })
    .catch(() => {});
  await page.locator(".inbox-overlay").getByText(/SHARED QUEUE/i).waitFor({ timeout: 15000 });
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });
const context = await browser.newContext();
await prepareSmokeContext(context);
const seedApi = await playwrightRequest.newContext();
const page = await context.newPage();
page.on("pageerror", (err) => errors.push(err.message));

try {
  await loginAdmin(page);
  const seeded = await seedPromoterApplication(seedApi);
  record("Seed promoter application via API", seeded.type === "PROMOTER_APPLICATION", `id=${seeded.id}`);

  await openAdminQueue(page);
  await page.screenshot({ path: join(OUT, "01-admin-queue.png"), fullPage: true });

  const kicker = await page.locator(".inbox-overlay").getByText(/SHARED QUEUE/i).isVisible();
  record("Admin tab shows shared queue kicker", kicker, `visible=${kicker}`);

  const promoterTag = page.locator(".inbox-overlay").getByText("PROMOTER", { exact: true }).first();
  await promoterTag.waitFor({ timeout: 10000 });
  const applicantRow = page.locator(".inbox-overlay").getByText(APPLICANT_NAME).first();
  const applicantVisible = await applicantRow.isVisible();
  record("Promoter application visible in admin queue", applicantVisible, `applicant=${applicantVisible}`);

  await applicantRow.click();
  await page.waitForTimeout(250);
  const pitchVisible = await page.locator(".inbox-overlay").getByText(PITCH).isVisible();
  const orgVisible = await page.locator(".inbox-overlay").getByText("PW Test Org").isVisible();
  await page.screenshot({ path: join(OUT, "02-promoter-expanded.png"), fullPage: true });
  record(
    "Promoter row shows pitch and org when expanded",
    pitchVisible && orgVisible,
    `pitch=${pitchVisible} org=${orgVisible}`,
  );

  const duplicateTitle = await page.locator(".inbox-overlay").getByText(`Promoter Application: ${APPLICANT_NAME}`).count();
  record(
    "No duplicate PROMOTER_APPLICATION submission row",
    duplicateTitle === 0,
    `duplicateTitleCount=${duplicateTitle}`,
  );

  const approveBtn = page.locator(".inbox-overlay").getByRole("button", { name: /APPROVE PROMOTER/i }).first();
  await approveBtn.click();
  await page.waitForTimeout(600);

  const subsRes = await page.request.get(`${BASE}/api/admin/submissions`);
  const subs = subsRes.ok() ? await subsRes.json() : [];
  const ghost = subs.filter(
    (s) => s.submitterEmail === APPLICANT_EMAIL && s.type === "PROMOTER_APPLICATION" && s.status === "PENDING",
  );
  const applicantGone = !(await page.locator(".inbox-overlay").getByText(APPLICANT_NAME).isVisible().catch(() => false));
  await page.screenshot({ path: join(OUT, "03-after-approve.png"), fullPage: true });
  record(
    "Approve promoter clears queue and submission",
    ghost.length === 0 && applicantGone,
    `ghostPending=${ghost.length} applicantGone=${applicantGone}`,
  );

  const spotVisible = await page.locator(".inbox-overlay").getByText(SPOT_TITLE).isVisible();
  await page.screenshot({ path: join(OUT, "04-suggest-in-queue.png"), fullPage: true });
  record("Spotted/suggest event in admin queue", spotVisible, `titleVisible=${spotVisible}`);
} catch (err) {
  errors.push(String(err?.message || err));
  console.error(err);
  await page.screenshot({ path: join(OUT, "error.png"), fullPage: true }).catch(() => {});
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok).length;
console.log(`\n--- ${passed} passed, ${failed} failed, ${errors.length} page errors ---`);
if (errors.length) console.log("Page errors:", errors);
process.exit(failed > 0 || errors.length > 0 ? 1 : 0);