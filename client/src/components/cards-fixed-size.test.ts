import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Tucker: "Cards had set sizes and should never scale."
 * Card roots have one fixed pixel size and no scale transform of any kind (CSS scale()/scale:/zoom, hover or entrance).
 */
const here = dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(join(here, rel), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** [css file, selector (exact, as written in the rule), expected width, expected height] */
const FIXED: [string, string, string, string][] = [
  ["home/perspective-tunnel/PerspectiveTunnelHero.css", ".ptunnel__card", "214px", "286px"],
  ["home/TonightPanel.css", ".home-tonight__item .tonight-card.tonight-card--card", "var(--event-card-width)", "var(--event-card-height)"],
  ["home/OutzSmallCard.css", ".outz-small", "136px", "150px"],
  ["home/HomeStageCard.css", ".home-stage-card", "360px", "216px"],
  ["directory/OutzideFeatured.css", ".outz-featured__grid .tonight-card--card.today-location", "var(--outz-featured-w)", "var(--outz-featured-h)"],
];

function rules(css: string): { sel: string; body: string }[] {
  const out: { sel: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m = re.exec(css); m; m = re.exec(css)) out.push({ sel: m[1].trim(), body: m[2] });
  return out;
}
const decl = (body: string, prop: string) => new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();

test("card roots declare one fixed width and height (no vw, clamp, min(), %, or aspect-ratio sizing)", () => {
  for (const [file, selector, w, h] of FIXED) {
    const hit = rules(read(file)).filter(r => r.sel.split(",").map(s => s.trim()).includes(selector));
    assert.ok(hit.length, `${file}: no rule for ${selector}`);
    const width = hit.map(r => decl(r.body, "width")).find(Boolean);
    const height = hit.map(r => decl(r.body, "height")).find(Boolean);
    assert.equal(width, w, `${file} ${selector} width`);
    assert.equal(height, h, `${file} ${selector} height`);
    for (const r of hit) assert.ok(!/aspect-ratio/.test(r.body), `${file} ${selector} uses aspect-ratio`);
  }
  assert.equal(decl(readFileSync(join(here, "ds/tokens/event-card.css"), "utf8"), "--event-card-width"), "200px");
  assert.equal(decl(readFileSync(join(here, "ds/tokens/event-card.css"), "utf8"), "--event-card-height"), "403px");
  const feat = read("directory/OutzideFeatured.css");
  assert.match(feat, /--outz-featured-w:360px;--outz-featured-h:540px;/);
});

test("card CSS never applies scale()/scaleX()/scaleY()/zoom to a card", () => {
  const files = [
    "home/perspective-tunnel/PerspectiveTunnelHero.css", "home/TonightPanel.css", "home/TonightEventCard.css",
    "home/TodayLocationCard.css", "home/OutzSmallCard.css", "home/HomeStageCard.css", "home/outz-accent-card.css",
    "directory/OutzideFeatured.css", "directory/PlacezOutzideSection.css", "board/MapBoardCards.css",
  ];
  for (const f of files) {
    const css = read(f);
    assert.ok(!/scale[XYZ3d]*\(/i.test(css), `${f}: scale()`);
    assert.ok(!/(^|[;{\s])zoom\s*:/.test(css), `${f}: zoom`);
    assert.ok(!/(^|[;{\s])scale\s*:\s*(?!none)/.test(css), `${f}: scale property`);
  }
});

test("hero card TSX paints a translate + rotate only: no scale, rotateX/Y, translateZ or perspective", () => {
  const tsx = readFileSync(join(here, "home/perspective-tunnel/PerspectiveTunnelHero.tsx"), "utf8");
  const painted = /el\.style\.transform = `([^`]*)`/.exec(tsx)?.[1] ?? "";
  assert.ok(painted.includes("translate(") && painted.includes("rotate("), painted);
  assert.ok(!/scale|rotateX|rotateY|translate3d|translateZ|perspective/i.test(painted), painted);
  const css = read("home/perspective-tunnel/PerspectiveTunnelHero.css");
  assert.ok(!/perspective\s*:|preserve-3d/.test(css));
});

test("the hero never reintroduces a scale: sweep is x/y/rotZ/opacity", () => {
  const math = readFileSync(join(here, "home/perspective-tunnel/tunnelMath.ts"), "utf8");
  assert.ok(!/out\.(scale|z|rotX|rotY)\b/.test(math));
});
