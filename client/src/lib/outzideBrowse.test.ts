import test from "node:test";
import assert from "node:assert/strict";
import { isPlacezType } from "../../../shared/directoryTheme";
import { filterOutzidePlaces, isDirectoryBrowseType, outzideSubcategoryOptions, readPlacezBrowseType } from "./outzideBrowse";

test("outzide is a Placez browse category and not a directory business type", () => {
  assert.equal(isDirectoryBrowseType("outzide"), true);
  assert.equal(isDirectoryBrowseType("cafe"), true);
  assert.equal(isDirectoryBrowseType("group"), false);
  assert.equal(isPlacezType("outzide"), false);
  assert.equal(readPlacezBrowseType(new URLSearchParams("type=outzide&sub=trail")), "outzide");
  assert.equal(readPlacezBrowseType(new URLSearchParams("type=cafe")), "cafe");
  assert.equal(readPlacezBrowseType(new URLSearchParams("type=outzide,bar")), "outzide");
  assert.equal(readPlacezBrowseType(new URLSearchParams("category=outzide")), "outzide");
  assert.equal(readPlacezBrowseType(new URLSearchParams("")), "ALL");
});

test("outzide subcategories are the destination kinds, with counts", () => {
  const places = [
    { name: "Angel's Rest", kind: "trail", region: "Columbia Gorge" },
    { name: "Latourell Falls", kind: "trail", region: "Columbia Gorge" },
    { name: "Rooster Rock", kind: "beach", region: "Columbia Gorge" },
    { name: "Mystery", kind: "nope", region: "Nowhere" },
  ];
  const options = outzideSubcategoryOptions(places);
  assert.deepEqual(options.map(option => option.id), ["trail", "beach"]);
  assert.equal(options[0].label, "Hikes");
  assert.equal(options[0].count, 2);
  assert.equal(filterOutzidePlaces(places, "trail", "").length, 2);
  assert.equal(filterOutzidePlaces(places, "ALL", "rooster").length, 1);
  assert.equal(filterOutzidePlaces(places, "beach", "hike").length, 0);
  assert.equal(filterOutzidePlaces(places, "ALL", "gorge").length, 3);
});
