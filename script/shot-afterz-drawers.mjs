import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shots = "/workspace/afterz-drawers/shots";
const fixture = "script/fixtures/afterz-drawers-browser.tsx";
await mkdir(shots, { recursive: true });

const server = await createServer({
  configFile: false,
  root,
  publicDir: path.join(root, "client/public"),
  plugins: [react(), {
    name: "afterz-drawer-qa",
    configureServer(s) {
      s.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__drawer-qa")) return next();
        const html = await s.transformIndexHtml(req.url, "<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>body{margin:0;background:#000}</style></head><body><div id=\"root\"></div><script type=\"module\" src=\"/script/fixtures/afterz-drawers-browser.tsx\"></script></body></html>");
        res.setHeader("Content-Type", "text/html");
        res.end(html);
      });
    },
  }],
  resolve: { alias: { "@": path.join(root, "client/src"), "@shared": path.join(root, "shared"), "@assets": path.join(root, "attached_assets") } },
  server: { host: "127.0.0.1", port: 0, hmr: false, watch: null },
});

await server.listen();
await server.warmupRequest("/" + fixture);
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
await context.route("**/api/**", route => {
  const req = route.request();
  const p = new URL(req.url()).pathname;
  if (req.method() !== "GET") return route.fulfill({ status: 200, json: { id: "g-new", left: true } });
  if (p === "/api/auth/session") return route.fulfill({ json: { id: 1, username: "qa", status: "active" } });
  if (p === "/api/afterz/window") return route.fulfill({ json: { open: true, startLocal: "21:00", endLocal: "06:00", timeZone: "America/Los_Angeles", opensAt: 0, closesAt: 0 } });
  if (p === "/api/afterz/nights" || p === "/api/afterz/gatherings" || p === "/api/afterz/eligible-events") return route.fulfill({ json: [] });
  if (p === "/api/events" || p === "/api/directory" || p === "/api/outz/buddies" || p === "/api/outz/feed" || p === "/api/outz/upcoming") return route.fulfill({ json: [] });
  return route.fulfill({ json: [] });
});

const shotsToTake = [
  { scene: "outzide", file: "v4-outzide-drawer.png", wait: "[data-testid='outzide-drawer']" },
  { scene: "afterz-open", file: "v4-afterz-drawer-in-window.png", wait: "[data-testid='afterz-drawer']" },
  { scene: "afterz-off", file: "v4-afterz-off-hours-blur.png", wait: "[data-testid='afterz-map-blur']" },
  { scene: "afterz-host", file: "v4-afterz-host-form.png", wait: "[data-testid='afterz-host-form']", clickHost: true },
  { scene: "afterz-open", file: "v4-afterz-needs-a-ride.png", wait: "[data-testid='ridez-need-list']", scrollNeeds: true, motion: true },
];

for (const shot of shotsToTake) {
  const page = await context.newPage();
  page.on("pageerror", err => console.error("pageerror", shot.scene, err));
  await page.goto(`${base}__drawer-qa?scene=${shot.scene}`, { waitUntil: "networkidle" });
  if (shot.clickHost) {
    const host = page.locator("[data-testid='afterz-host-button']");
    if (await host.count()) {
      const expanded = await host.getAttribute("aria-expanded");
      if (expanded !== "true") await host.click();
    }
  }
  await page.waitForSelector(shot.wait, { timeout: 20_000 });
  // In-window and off-hours stay at scroll 0 so the calendar is fully visible.
  if (shot.scene === "afterz-host") {
    const form = page.locator("[data-testid='afterz-host-form']");
    if (await form.count()) await form.evaluate(node => { node.closest(".dock-drawer__body")?.scrollTo(0, 0); });
  }
  if (shot.scene === "afterz-open" && !shot.scrollNeeds) {
    await page.locator(".dock-drawer__body").evaluate(node => { node.scrollTop = 0; });
  }
  if (shot.scrollNeeds) {
    const list = page.locator("[data-testid='ridez-need-list']");
    if (await list.count()) {
      await list.evaluate(node => { node.scrollIntoView({ block: "start", inline: "nearest" }); });
    }
  }
  if (shot.motion) {
    // Context defaults to reduced motion for other shots. This one must show
    // the flashing bloom, frozen at the peak so the frame is readable.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      for (const anim of document.getAnimations()) {
        const name = anim.animationName || "";
        if (name.includes("zridez-need-bloom")) {
          const duration = (anim.effect && "getComputedTiming" in anim.effect)
            ? (anim.effect.getComputedTiming().duration || 1100)
            : 1100;
          anim.pause();
          anim.currentTime = typeof duration === "number" ? duration / 2 : 550;
        }
      }
    });
  } else {
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(shots, shot.file), fullPage: false });
  console.log("wrote", path.join(shots, shot.file));
  await page.close();
}

await browser.close();
await server.close();
