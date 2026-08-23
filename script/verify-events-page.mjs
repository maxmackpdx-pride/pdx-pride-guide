import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:5050/events";

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
});
const page = await browser.newPage();

const errors = [];
page.on("pageerror", (err) => {
  if (/WebSocket closed without opened|failed to connect to websocket/i.test(err.message)) return;
  errors.push(err.message);
});
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (
    /vite-hmr|failed to connect to websocket|WebSocket closed without opened|status of 401|status of 400/i.test(
      text,
    )
  ) {
    return;
  }
  errors.push(text);
});

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(2500);

const rootText = await page.locator("#root").innerText().catch(() => "");
const posterCards = await page.locator('[data-testid^="event-card-"]').count();
const pageHero = await page.locator(".page-hero, .board-hero").count();
const posterGrid = await page.locator(".events-poster-grid").count();
const emptyBoard = await page.locator(".board-empty").count();
const loading = await page.getByText("Loading events").count();
const hasBoard = /LIVE LISTINGS|THE BOARD|EVENTZ/i.test(rootText);

const result = {
  url,
  errors,
  posterCards,
  pageHero,
  posterGrid,
  emptyBoard,
  loading,
  rootPreview: rootText.slice(0, 400),
  ok:
    errors.length === 0
    && pageHero > 0
    && loading === 0
    && (posterCards > 0 || emptyBoard > 0 || hasBoard),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();
process.exit(result.ok ? 0 : 1);