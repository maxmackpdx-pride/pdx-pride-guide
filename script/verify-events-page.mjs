import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:5050/#/events";

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => errors.push(err.message));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });

const rootText = await page.locator("#root").innerText().catch(() => "");
const posterCards = await page.locator('[data-testid^="event-card-"]').count();
const pageHero = await page.locator(".page-hero").count();
const posterGrid = await page.locator(".events-poster-grid").count();
const loading = await page.getByText("Loading events").count();

const result = {
  url,
  errors,
  posterCards,
  pageHero,
  posterGrid,
  loading,
  rootPreview: rootText.slice(0, 400),
  ok: errors.length === 0 && posterCards > 0 && pageHero > 0,
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);