import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const assetsDir = "dist/public/assets";
const assets = readdirSync(assetsDir);
// Route-level splitting moves page signatures into named lazy chunks. Scan the
// complete JavaScript build so positive and negative guards describe the whole
// deploy bundle instead of whichever file happens to be the main entry.
const jsFiles = assets.filter((f) => f.endsWith(".js"));
const cssFile = assets.find((f) => f.startsWith("index-") && f.endsWith(".css"));

if (jsFiles.length === 0 || !cssFile) {
  console.error("Missing built index assets in dist/public/assets");
  process.exit(1);
}

const jsFile = jsFiles.join(", ");
const js = jsFiles.map((f) => readFileSync(join(assetsDir, f), "utf8")).join("\n");
const css = readFileSync(join(assetsDir, cssFile), "utf8");
const sourceCss = readFileSync("client/src/index.css", "utf8");
const dashboardCss = readFileSync("client/src/components/dashboard/dashboard.css", "utf8");

// A cached map document must keep every relative import and logo in its version directory.
const flightBase = JSON.parse(readFileSync("dist/public/zaydar-manifest.json", "utf8")).base;
function flightFilesMatch(directory, relative = "") {
  return readdirSync(directory, { withFileTypes: true }).every(entry => {
    const source = join(directory, entry.name), child = join(relative, entry.name);
    if (entry.isDirectory()) return flightFilesMatch(source, child);
    const built = join("dist/public", flightBase, child);
    return existsSync(built) && readFileSync(source).equals(readFileSync(built));
  });
}

const checks = {
  versionedZaydar: /^\/assets\/zaydar-[a-f0-9]{16}$/.test(flightBase) && js.includes(flightBase) && flightFilesMatch("client/public/home-flight"),
  posterGrid: js.includes("events-poster-grid"),
  noEventBoardCard: !js.includes("EventBoardCard"),
  noLegacyPageHeroCss: !sourceCss.includes(".page-hero") && !sourceCss.includes(".zine-hero"),
  noRainbowButtonHover: !sourceCss.includes("linear-gradient(90deg, #E40303"),
  barlowFonts:
    sourceCss.includes("--font-board-display: 'Barlow Condensed'") &&
    !sourceCss.includes("Anton") &&
    !dashboardCss.includes("DM Mono"),
  noLegacyHeroOverlays: !js.includes("hero-video-overlays") && !js.includes("home-hero-glitch"),
  noPageHeroKickers: !js.includes("PRIDE WEEKEND 2026") && !js.includes("ABOUT THIS GUIDE"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ jsFile, cssFile, checks, ok: failed.length === 0 }, null, 2));

if (failed.length) {
  console.error("Deploy bundle checks failed:", failed.join(", "));
  process.exit(1);
}
