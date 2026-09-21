import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import {
  DESIGN_COMPONENT_REGISTRY,
  DESIGN_COMPONENT_SOURCE_REPOSITORY,
  findDesignComponent,
} from "../shared/designComponentRegistry";

assert.equal(DESIGN_COMPONENT_SOURCE_REPOSITORY, "maxmackpdx-pride/pdx-pride-guide");
assert.equal(DESIGN_COMPONENT_REGISTRY.length, 23, "the connected registry must cover all 23 cataloged React objects");

const ids = new Set<string>();
const sourcePairs = new Set<string>();
for (const component of DESIGN_COMPONENT_REGISTRY) {
  assert.match(component.id, /^component:[a-z-]+\/[A-Za-z][A-Za-z0-9]*$/);
  assert.equal(ids.has(component.id), false, `duplicate object id: ${component.id}`);
  ids.add(component.id);

  assert.match(component.sourcePath, /^client\/src\/components\/[A-Za-z0-9_./-]+\.tsx$/);
  assert.equal(component.sourcePath.includes(".."), false);
  await access(path.resolve(component.sourcePath));

  const sourcePair = `${component.sourcePath}#${component.exportName}`;
  assert.equal(sourcePairs.has(sourcePair), false, `duplicate source export: ${sourcePair}`);
  sourcePairs.add(sourcePair);

  const specimen = new URL(component.specimenUrl, "https://www.zaylist.com");
  assert.equal(specimen.pathname, "/design-system/specimen");
  assert.equal(specimen.searchParams.get("id"), component.id);
  assert.equal(findDesignComponent(component.id), component);
}

assert.equal(findDesignComponent("component:forms/NotReal"), null);
const staticServerSource = await readFile(path.resolve("server/static.ts"), "utf8");
assert.match(
  staticServerSource,
  /APP_PATHS[\s\S]*["']\/design-system\/specimen["']/,
  "the production specimen SPA route must remain in the HTTP-200 app path allowlist",
);
console.log(`Verified ${DESIGN_COMPONENT_REGISTRY.length} canonical Design API component identities.`);
