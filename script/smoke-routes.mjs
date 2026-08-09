/**
 * Route smoke: load every public route in a real browser and fail on anything
 * a visitor would experience as broken.
 *
 * Catches per route:
 *   - uncaught exceptions and the ErrorBoundary ("Something went sideways")
 *   - console errors
 *   - failed asset requests (a 404 on /assets means a stale or bad chunk)
 *   - 5xx from our own API
 *   - unexpected final URL (a redirect that no longer lands where it should)
 *
 * Usage:  node script/smoke-routes.mjs [baseUrl]
 * Needs a running server. Defaults to http://localhost:5055.
 *
 * Run the target server with LOCAL_PREVIEW=1 (or NODE_ENV=development). A full
 * sweep fires roughly 300 API calls, which is the production rate limit, and a
 * limited server reports 429s that look like route failures but are not.
 */
import { chromium } from "playwright";

const BASE = (process.argv[2] || process.env.SMOKE_BASE || "http://localhost:5055").replace(/\/$/, "");
const SETTLE_MS = 3500;

/** [path, expected final path]. Expected null means "wherever it lands is fine". */
const ROUTES = [
  ["/", "/"],
  ["/events", "/events"],
  ["/schedule", "/schedule"],
  ["/submit", "/submit"],
  ["/pride-work", "/pride-work"],
  ["/gifting", "/gifting"],
  ["/the-hauz", "/the-hauz"],
  ["/the-hauz/new", "/the-hauz/new"],
  ["/spotted", "/spotted"],
  ["/directory", "/directory"],
  ["/nude-beaches", "/nude-beaches"],
  ["/next", "/next"],
  ["/about", "/about"],
  ["/resume", "/resume"],
  ["/contact", "/contact"],
  ["/sponsors", "/sponsors"],
  ["/access", "/access"],
  ["/legal", "/legal"],
  ["/design-preview", "/design-preview"],
  // Auth-gated: must render a signed-out state, not crash.
  ["/dashboard", null],
  ["/inbox", null],
  ["/admin", null],
  ["/settings/notifications", null],
  // Legacy paths that must still redirect.
  ["/gigs", "/pride-work"],
  ["/housing", "/the-hauz"],
  ["/hausing", "/the-hauz"],
  ["/darkroom", "/next"],
  ["/missed-connections", "/spotted"],
  // Unknown path must reach the 404 page without crashing.
  ["/definitely-not-a-real-page", null],
];

/**
 * Detail routes need real ids, so they are discovered from the API at run time
 * rather than hardcoded. A seeded id would rot the moment the data changed.
 */
async function detailRoutes() {
  const out = [];
  const grab = async (path) => {
    try {
      const res = await fetch(BASE + path);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  };
  const events = await grab("/api/events");
  if (events[0]?.id) out.push([`/events/${events[0].id}`, null]);
  const places = await grab("/api/directory");
  if (places[0]?.id) out.push([`/directory/${places[0].id}`, null]);
  if (!out.length) console.log("note: no seeded events or places, skipping detail routes");
  return out;
}

// Console noise that is not a real defect.
const IGNORE_CONSOLE = [
  /favicon/i,
  /Failed to load resource.*googletagmanager/i,
  /net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|TUNNEL)/i,
  // /api/auth/me answers 401 for every signed-out visitor. That is the
  // contract, not a fault, and it fires on every route.
  /Failed to load resource.*status of 401/i,
];

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const results = [];

const ALL_ROUTES = [...ROUTES, ...(await detailRoutes())];

for (const [route, expected] of ALL_ROUTES) {
  const page = await ctx.newPage();
  const problems = [];

  page.on("pageerror", (err) => problems.push(`uncaught: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (IGNORE_CONSOLE.some((re) => re.test(text))) return;
    problems.push(`console: ${text.slice(0, 160)}`);
  });
  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (url.includes("/assets/") && status >= 400) problems.push(`asset ${status}: ${url.split("/").pop()}`);
    if (url.includes("/api/") && status >= 500) problems.push(`api ${status}: ${new URL(url).pathname}`);
  });

  try {
    await page.goto(BASE + route, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(SETTLE_MS);

    if (await page.locator("text=Something went sideways").count()) {
      problems.push("ErrorBoundary rendered");
    }
    // Trailing slash is the same route; only a different path is a redirect bug.
    const landed = new URL(page.url()).pathname.replace(/(.)\/$/, "$1");
    if (expected && landed !== expected) problems.push(`landed on ${landed}, expected ${expected}`);
    // A route that renders nothing is broken even without an error. Measure the
    // whole page: hub and gate screens render outside <main>.
    const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
    if (bodyText.length < 40) problems.push(`page renders nothing (${bodyText.length} chars)`);
  } catch (err) {
    problems.push(`navigation failed: ${err.message.split("\n")[0]}`);
  }

  await page.close();
  results.push({ route, problems });
  const label = problems.length ? "FAIL" : "ok  ";
  console.log(`${label} ${route}`);
  problems.forEach((p) => console.log(`       ${p}`));
}

await browser.close();

const failed = results.filter((r) => r.problems.length);
console.log(`\n${results.length - failed.length}/${results.length} routes clean`);
if (failed.length) {
  console.log("\nRoutes needing attention:");
  failed.forEach((r) => console.log(`  ${r.route}  (${r.problems.length})`));
  process.exit(1);
}
