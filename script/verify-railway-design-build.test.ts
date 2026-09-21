import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildDesignComponentSourceEvidence } from "./design-component-source-evidence";
import { evaluateRailwayDesignBuild, verifyRailwayDesignBuild } from "./verify-railway-design-build";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const revision = "a".repeat(40), old = "b".repeat(40), file = "client/src/components/ds/Button.tsx";

async function evidence() {
  const local = await buildDesignComponentSourceEvidence();
  const previous = structuredClone(local);
  previous.sources.find(source => source.path === file)!.sha256 = "f".repeat(64);
  previous.evidenceChecksum = digest(JSON.stringify(previous.sources));
  return { local, live: { sourceRepository: "maxmackpdx-pride/pdx-pride-guide", sourceRevisionVerified: true as const, sourceRevision: old,
    registryChecksum: local.registryChecksum, sourceEvidence: previous } };
}

test("Railway accepts unchanged canonical source without approval", async () => {
  const { local, live } = await evidence();
  live.sourceEvidence = local;
  assert.deepEqual(evaluateRailwayDesignBuild(local, live, [], revision).changed, []);
});

test("Railway rejects a changed source with no exact owner-approved handoff", async () => {
  const { local, live } = await evidence();
  assert.throws(() => evaluateRailwayDesignBuild(local, live, [], revision), /exact approved design handoff/);
  const after = await fs.readFile(file, "utf8");
  const payload = { target: { repository: "maxmackpdx-pride/pdx-pride-guide", baseRevision: old, registryChecksum: local.registryChecksum },
    sourceChanges: [{ path: file, beforeSha256: "f".repeat(64), after }] };
  const proposal = { id: "12345678-1234-1234-1234-123456789abc", status: "approved", lastEventId: 3,
    events: [{ kind: "approved" }], payload, checksum: digest(JSON.stringify(payload)) };
  const result = evaluateRailwayDesignBuild(local, live, [proposal], revision);
  assert.equal(result.proposalId, proposal.id);
  assert.match(result.sourceProofChecksum!, /^[a-f0-9]{64}$/);
  assert.throws(() => evaluateRailwayDesignBuild(local, live, [{ ...proposal, status: "revoked" }], revision), /exact approved/);
  assert.throws(() => evaluateRailwayDesignBuild(local, live, [{ ...proposal, checksum: "0".repeat(64) }], revision), /exact approved/);
  assert.throws(() => evaluateRailwayDesignBuild(local, live, [{ ...proposal, payload: { ...payload, sourceChanges: [{ ...payload.sourceChanges[0], after: "tampered" }] } }], revision), /exact approved/);
});

test("Railway bootstrap only permits the pinned unmodified source graph", async () => {
  const result = await verifyRailwayDesignBuild({ revision, fetcher: async () => { throw new Error("not deployed"); }, attempts: 1 });
  assert.equal(result.bootstrap, true);
});

test("Railway waits for the exact Foundation preparation before building changed source", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zay-railway-gate-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const local = await buildDesignComponentSourceEvidence();
  for (const source of local.sources) {
    const destination = path.join(root, source.path);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source.path, destination);
  }
  const { live } = await evidence(), after = await fs.readFile(file, "utf8");
  const payload = { target: { repository: "maxmackpdx-pride/pdx-pride-guide", baseRevision: old, registryChecksum: local.registryChecksum },
    sourceChanges: [{ path: file, beforeSha256: "f".repeat(64), after }] };
  const id = "12345678-1234-1234-1234-123456789abc";
  await fs.mkdir(path.join(root, "design-publications/product"), { recursive: true });
  await fs.writeFile(path.join(root, `design-publications/product/${id}.json`), JSON.stringify({ id, status: "approved", lastEventId: 3,
    events: [{ kind: "approved" }], payload, checksum: digest(JSON.stringify(payload)) }));
  let authorizationChecks = 0, waits = 0;
  const fetcher = async (input: string | URL | Request) => {
    if (String(input).endsWith("/components")) return Response.json(live);
    authorizationChecks++;
    return Response.json({ authorized: authorizationChecks === 2 });
  };
  const result = await verifyRailwayDesignBuild({ root, revision, fetcher: fetcher as typeof fetch,
    wait: async () => { waits++; }, attempts: 2 });
  assert.equal(result.authorized, true);
  assert.equal(waits, 1);
  assert.equal(authorizationChecks, 2);
});
