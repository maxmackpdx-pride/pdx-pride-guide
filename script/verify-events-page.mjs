import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:5050/events";

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
const boardTab = await page.locator('[data-testid="events-tab-board"]').count();
const eventsCount = await page.locator('[data-testid="events-count"]').count();
const pageHero = await page.locator(".board-hero, .events-hero, [data-testid='events-tab-board']").count();
const loading = await page.getByText("Loading events").count();
const noise = errors.filter((text) =>
  /vite-hmr|failed to connect to websocket|WebSocket closed without opened|React does not recognize the|status of 401|status of 400/i.test(text),
);
const realErrors = errors.filter((text) => !noise.includes(text));

const result = {
  url,
  errors: realErrors,
  ignored: noise.length,
  boardTab,
  eventsCount,
  pageHero,
  loading,
  rootPreview: rootText.slice(0, 400),
  ok: realErrors.length === 0 && boardTab > 0 && pageHero > 0,
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);