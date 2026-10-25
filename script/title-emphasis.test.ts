import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { emphasizeTitle, pickEmphasisWord, titleWords } from "../client/public/map-foundation/title-emphasis.js";
import { ransomLetters } from "../client/src/components/board/punk/ransomStyles.mjs";

const places: { id: string; name: string }[] = JSON.parse(readFileSync(new URL("../client/public/outzide-map/places.json", import.meta.url), "utf8")).places;

test("every Outzide title has exactly one whole emphasized word", () => {
  for (const p of places) {
    const out = emphasizeTitle(p.name, `outz:${p.id}`);
    assert.equal(out.length, titleWords(p.name).length, p.name);
    assert.equal(out.filter(w => w.emphasis).length, 1, `${p.name}: exactly one inverted word`);
    assert.equal(out.map(w => w.text).join(" "), titleWords(p.name).join(" "), "words are whole and unchanged");
  }
});

test("emphasis is a pure function of title + seed", () => {
  for (const p of places.slice(0, 80)) {
    assert.equal(pickEmphasisWord(p.name, `outz:${p.id}`), pickEmphasisWord(p.name, `outz:${p.id}`));
    assert.deepEqual(emphasizeTitle(p.name, `outz:${p.id}`), emphasizeTitle(p.name, `outz:${p.id}`));
  }
  assert.equal(pickEmphasisWord("Silver Falls State Park", "outz:silver-falls"), pickEmphasisWord("Silver Falls State Park", "outz:silver-falls"));
});

test("single-word titles invert that word; empty titles have none; connectives are skipped", () => {
  assert.deepEqual(emphasizeTitle("Multnomah", "x"), [{ text: "Multnomah", emphasis: true }]);
  assert.equal(pickEmphasisWord("", "x"), -1);
  assert.deepEqual(emphasizeTitle("   ", "x"), []);
  for (let i = 0; i < 40; i++) {
    const idx = pickEmphasisWord("Lake of the Woods", `seed-${i}`);
    assert.ok(["Lake", "the", "Woods"].includes(titleWords("Lake of the Woods")[idx]) && titleWords("Lake of the Woods")[idx] !== "of");
  }
  assert.equal(pickEmphasisWord("A B", "s") >= 0, true);
});

test("the choice is spread across positions, not always the first/last word", () => {
  const multi = places.filter(p => titleWords(p.name).length >= 3);
  const counts = new Map<number, number>();
  for (const p of multi) { const i = pickEmphasisWord(p.name, `outz:${p.id}`); counts.set(i, (counts.get(i) ?? 0) + 1); }
  assert.ok(counts.size >= 3, `positions used: ${[...counts.keys()]}`);
});

test("RansomTitle markup: one tiled word, other words plain, every tile uses its resolved palette", async () => {
  // Overlays.jsx imports .css; stub it so it loads under node.
  register("data:text/javascript," + encodeURIComponent("export async function load(u,c,n){ if(u.endsWith('.css')) return {format:'module',source:'export default {}',shortCircuit:true}; return n(u,c); }"));
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { RansomTitle } = (await import("../client/src/components/xerox/Overlays.jsx")) as any;
  for (const p of places.slice(0, 60)) {
    const html = renderToStaticMarkup(React.createElement(RansomTitle, { text: p.name, seed: `outz:${p.id}` }));
    assert.equal((html.match(/data-emphasis="true"/g) ?? []).length, 1, p.name);
    assert.equal((html.match(/class="xr-rw xr-pw"/g) ?? []).length, titleWords(p.name).length - 1, p.name);
    const emphasized = emphasizeTitle(p.name, `outz:${p.id}`).find(w => w.emphasis)!.text;
    const tiles = [...html.matchAll(/<span class="xr-rl"[^>]*>([^<]*)<\/span>/g)].map(m => m[1]);
    assert.equal(tiles.join(""), emphasized.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;"), p.name);
    const expect = ransomLetters(emphasized, `outz:${p.id}:${emphasized}`, "dark");
    for (const l of expect) assert.ok(html.includes(`-${l.style.toLowerCase()}-${l.palette}`), "palette honoured");
  }
});
