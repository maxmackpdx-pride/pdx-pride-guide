import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareProductDesignProposal } from "./prepare-design-component-proposal";

test("prepares an exact proposal from the deployed component revision", async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zay-product-proposal-")); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "--quiet"); git("config", "user.name", "Test"); git("config", "user.email", "test@example.com");
  await fs.mkdir(path.join(root, "client/src/components/ds"), { recursive: true });
  const file = "client/src/components/ds/Button.tsx";
  await fs.writeFile(path.join(root, file), "export const Button = () => 'before';\n"); git("add", file); git("commit", "--quiet", "-m", "base");
  const revision = git("rev-parse", "HEAD").trim(); await fs.writeFile(path.join(root, file), "export const Button = () => 'after';\n");
  const fetcher = async (url: string) => new Response(JSON.stringify(url.includes("/release") ? { release: { id: "guide-1" }, checksum: "a".repeat(64) } : {
    sourceRepository: "maxmackpdx-pride/pdx-pride-guide", sourceRevision: revision, registryChecksum: "b".repeat(64),
    components: [{ id: "component:forms/Button", sourcePath: file }],
  }), { headers: { "content-type": "application/json" } });
  const proposal = await prepareProductDesignProposal({ root, files: [file], title: "Button", rationale: "Exact source", recordIds: ["component:forms/Button"], fetcher: fetcher as typeof fetch });
  assert.equal(proposal.target.baseRevision, revision);
  assert.equal(proposal.sourceChanges[0].after, "export const Button = () => 'after';\n");
  assert.match(proposal.sourceChanges[0].beforeSha256, /^[a-f0-9]{64}$/);
});
