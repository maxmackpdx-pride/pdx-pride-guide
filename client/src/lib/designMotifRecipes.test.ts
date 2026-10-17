import assert from "node:assert/strict";
import test from "node:test";
import { FOUNDATION_ORIGIN, MOTIF_DAYS, REQUIRED_MOTIF_CATEGORIES, categoryMotifRecipe, parseMotifRecipes, resourceMotifCategory, type MotifRecipes, type MotifRoom } from "./designMotifRecipes";

function fixture(): MotifRecipes {
  const categories = Object.entries(REQUIRED_MOTIF_CATEGORIES).flatMap(([room, keys]) => keys.map(category => ({ room: room as MotifRoom, category, heroId: `hero-${room}-${category}`, companionId: `companion-hero-${room}-${category}` })));
  categories.push({ room: "boardz", category: "giftz", intent: "iso", heroId: "hero-boardz-giftz-iso", companionId: "companion-hero-boardz-giftz-iso" } as typeof categories[number]);
  const layers = ["a-back", "a-middle", "a-front", "b-back", "b-middle", "b-front"];
  const dayPairs = Object.fromEntries(MOTIF_DAYS.map(day => [day, { frontId: `${day}-front`, backId: `${day}-back`, colorId: `${day}-color`, invertedId: `${day}-inverted` }])) as MotifRecipes["dayPairs"];
  const ids = [...layers, ...categories.flatMap(recipe => [recipe.heroId, recipe.companionId]), ...Object.values(dayPairs).flatMap(pair => Object.values(pair))];
  return { release: "test-1", categories, dayPairs, networkSets: { a: layers.slice(0, 3) as [string, string, string], b: layers.slice(3) as [string, string, string] }, assets: Object.fromEntries(ids.map(id => [id, { id, url: `${FOUNDATION_ORIGIN}/api/design/v1/motifs/${id}/file` }])) };
}

test("published recipe keeps Giftz ISO distinct and uses a paired companion", () => {
  const recipes = parseMotifRecipes(fixture());
  assert.equal(categoryMotifRecipe(recipes, "boardz", "giftz", "iso")?.heroId, "hero-boardz-giftz-iso");
  assert.equal(categoryMotifRecipe(recipes, "boardz", "giftz", "giving")?.companionId, "companion-hero-boardz-giftz");
  assert.deepEqual(resourceMotifCategory("place-bar"), { room: "placez", category: "bar" });
  assert.deepEqual(resourceMotifCategory("hauz"), { room: "boardz", category: "housing" });
  const outzide = fixture();
  const id = "outzide-place-usfs-6217.005511";
  outzide.assets[id] = { id, url: `${FOUNDATION_ORIGIN}/api/design/v1/motifs/${id}/file` };
  assert.ok(parseMotifRecipes(outzide).assets[id]);
  const uppercaseId = "eventz-motifs-DANCE";
  const sha256 = "a".repeat(64);
  outzide.assets[uppercaseId] = { id: uppercaseId, sha256, url: `${FOUNDATION_ORIGIN}/api/design/v1/motifs/${uppercaseId}/file?v=${sha256.slice(0, 16)}` };
  assert.ok(parseMotifRecipes(outzide).assets[uppercaseId]);
  outzide.assets[uppercaseId].url += "&redirect=elsewhere";
  assert.throws(() => parseMotifRecipes(outzide), /Unrecognized motif asset URL/);
});

test("incomplete or malformed releases cannot replace checked artwork", () => {
  const missingAsset = fixture();
  delete missingAsset.assets["companion-hero-boardz-giftz-iso"];
  assert.throws(() => parseMotifRecipes(missingAsset), /unavailable artwork/);
  const missingCategory = fixture();
  missingCategory.categories = missingCategory.categories.filter(recipe => recipe.category !== "housing");
  assert.throws(() => parseMotifRecipes(missingCategory), /Missing motif recipe/);
  const wrongLayers = fixture();
  wrongLayers.networkSets.a.pop();
  assert.throws(() => parseMotifRecipes(wrongLayers), /three published layers/);
  const foreignUrl = fixture();
  foreignUrl.assets["hero-boardz-housing"].url = "https://example.org/house.png";
  assert.throws(() => parseMotifRecipes(foreignUrl), /Unrecognized motif asset URL/);
  const missingDay = fixture();
  delete missingDay.assets[missingDay.dayPairs.wed.frontId];
  assert.throws(() => parseMotifRecipes(missingDay), /Incomplete day motif pair: wed/);
});
