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
const eventsJs = jsFiles.filter(f => /^Events-.*\.js$/.test(f)).map(f => readFileSync(join(assetsDir, f), "utf8")).join("\n");
// Board CSS may be hoisted into a shared chunk (EventModal also renders the
// open card), so collect every stylesheet Vite loads with the Events route:
// its own CSS plus the CSS of its static imports, per the build manifest.
function routeCssFiles(entryPattern) {
  const manifestPath = "dist/public/.vite/manifest.json";
  if (!existsSync(manifestPath)) return assets.filter(f => /^Events-.*\.css$/.test(f)).map(f => join(assetsDir, f));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const start = Object.keys(manifest).find(key => entryPattern.test(key));
  const seen = new Set(), files = new Set();
  const walk = key => {
    if (!key || seen.has(key) || !manifest[key]) return;
    seen.add(key);
    for (const file of manifest[key].css ?? []) files.add(join("dist/public", file));
    for (const dep of manifest[key].imports ?? []) if (dep !== "index.html") walk(dep);
  };
  walk(start);
  return [...files];
}
const eventsCss = routeCssFiles(/(^|\/)pages\/Events\.tsx$/).map(f => readFileSync(f, "utf8")).join("\n");

// A cached map document must keep every relative import and logo in its version directory.
const flightBase = JSON.parse(readFileSync("dist/public/home-flight-manifest.json", "utf8")).base;
function flightFilesMatch(directory, relative = "") {
  return readdirSync(directory, { withFileTypes: true }).every(entry => {
    const source = join(directory, entry.name), child = join(relative, entry.name);
    if (entry.isDirectory()) return flightFilesMatch(source, child);
    const built = join("dist/public", flightBase, child);
    return existsSync(built) && readFileSync(source).equals(readFileSync(built));
  });
}

const checks = {
  versionedHomeFlight: /^\/assets\/home-flight-[a-f0-9]{16}$/.test(flightBase) && (js.includes(flightBase) || js.includes("/home-globe/holograms.webp")) && flightFilesMatch("client/public/home-flight"),
  homepageGlobe: ["holograms.webp", "portland-city-beam-density.png"].every(name => {
    const route = `/home-globe/${name}`, built = join("dist/public", route);
    return js.includes(route) && existsSync(built) && readFileSync(`client/public${route}`).equals(readFileSync(built));
  }),
  flyerBoard: eventsJs.includes("fbx-content") && eventsJs.includes("PLAN AHEAD") && eventsCss.includes(".fbx .poster"),
  noEventBoardCard: !js.includes("EventBoardCard"),
  noLegacyPageHeroCss: !sourceCss.includes(".page-hero") && !sourceCss.includes(".zine-hero"),
  noRainbowButtonHover: !sourceCss.includes("linear-gradient(90deg, #E40303"),
  noLegacyHeroOverlays: !js.includes("hero-video-overlays") && !js.includes("home-hero-glitch"),
  noPageHeroKickers: !js.includes("PRIDE WEEKEND 2026") && !js.includes("ABOUT THIS GUIDE"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
console.log(JSON.stringify({ jsFile, cssFile, checks, ok: failed.length === 0 }, null, 2));

if (failed.length) {
  console.error("Deploy bundle checks failed:", failed.join(", "));
  process.exit(1);
}
