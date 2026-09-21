import assert from "node:assert/strict";
import test from "node:test";
import { buildDesignComponentSourceEvidence } from "./design-component-source-evidence";
import { DESIGN_COMPONENT_REGISTRY } from "../shared/designComponentRegistry";

test("build evidence seals every registered component source and canonical token stylesheet", async () => {
  const evidence = await buildDesignComponentSourceEvidence();
  assert.equal(evidence.registryChecksum.length, 64);
  assert.equal(evidence.evidenceChecksum.length, 64);
  for (const component of DESIGN_COMPONENT_REGISTRY) assert.ok(evidence.sources.some(source => source.path === component.sourcePath && /^[a-f0-9]{64}$/.test(source.sha256)));
  assert.ok(evidence.sources.some(source => source.path === "client/src/components/ds/tokens/glass.css"));
  assert.equal(new Set(evidence.sources.map(source => source.path)).size, evidence.sources.length);
});
