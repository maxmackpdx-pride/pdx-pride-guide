import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const assetsDir = "dist/public/assets";
const assets = readdirSync(assetsDir);
const jsFile = assets.find((f) => f.startsWith("index-") && f.endsWith(".js"));
const cssFile = assets.find((f) => f.startsWith("index-") && f.endsWith(".css"));

if (!jsFile || !cssFile) {
  console.error("Missing built index assets in dist/public/assets");
  process.exit(1);
}

const js = readFileSync(join(assetsDir, jsFile), "utf8");
const css = readFileSync(join(assetsDir, cssFile), "utf8");
const sourceCss = readFileSync("client/src/index.css", "utf8");
const dashboardCss = readFileSync("client/src/components/dashboard/dashboard.css", "utf8");

const checks = {
  posterGrid: js.includes("events-poster-grid"),
  noEventBoardCard: !js.includes("EventBoardCard"),
  pageHeroPanel: sourceCss.includes(".page-hero__panel"),
  noRainbowButtonHover: !sourceCss.includes("linear-gradient(90deg, #E40303"),
  barlowFonts:
    sourceCss.includes("--font-board-display: 'Barlow Condensed'") &&
    !sourceCss.includes("Anton") &&
    !dashboardCss.includes("DM Mono"),
  hiddenBoardKicker: sourceCss.includes(".page-hero .board-kicker") && sourceCss.includes("display: none"),
  noPageHeroKickers: !js.includes("PRIDE WEEKEND 2026") && !js.includes("ABOUT THIS GUIDE"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ jsFile, cssFile, checks, ok: failed.length === 0 }, null, 2));

if (failed.length) {
  console.error("Deploy bundle checks failed:", failed.join(", "));
  process.exit(1);
}