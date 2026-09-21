import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { DESIGN_COMPONENT_REGISTRY } from "../shared/designComponentRegistry";
import { discoverProductPublication, publicationApi, verifyProductPublication } from "./design-product-publication";

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "zay-product-publication-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  git("init", "--quiet"); git("config", "user.name", "Test"); git("config", "user.email", "test@example.com");
  const button = "client/src/components/ds/Button.tsx", badge = "client/src/components/ds/Badge.tsx";
  await fs.mkdir(path.join(root, "client/src/components/ds"), { recursive: true });
  await fs.writeFile(path.join(root, button), "export const Button = () => 'before';\n");
  await fs.writeFile(path.join(root, badge), "export const Badge = () => 'same';\n");
  git("add", "."); git("commit", "--quiet", "-m", "base");
  const baseRevision = git("rev-parse", "HEAD").trim(), after = "export const Button = () => 'after';\n";
  const payload = { title: "Button", rationale: "Approved exact source", recordIds: ["component:forms/Button"],
    target: { repository: "maxmackpdx-pride/pdx-pride-guide", baseRevision, registryChecksum: "b".repeat(64) },
    sourceChanges: [{ path: button, beforeSha256: digest("export const Button = () => 'before';\n"), after }] };
  const id = "12345678-1234-1234-1234-123456789abc";
  const proposal = { id, status: "approved", checksum: digest(JSON.stringify(payload)), lastEventId: 2, payload,
    events: [{ id: 1, kind: "submitted" }, { id: 2, kind: "approved" }] };
  await fs.writeFile(path.join(root, button), after);
  const publication = `design-publications/product/${id}.json`;
  await fs.mkdir(path.join(root, "design-publications/product"), { recursive: true });
  await fs.writeFile(path.join(root, publication), JSON.stringify(proposal));
  git("add", "."); git("commit", "--quiet", "-m", "approved component source");
  const sources = [{ path: badge, sha256: digest("export const Badge = () => 'same';\n") }, { path: button, sha256: digest(after) }];
  await fs.mkdir(path.join(root, "dist"));
  await fs.writeFile(path.join(root, "dist/design-component-source-evidence.json"), JSON.stringify({ schemaVersion: 1,
    registryChecksum: digest(JSON.stringify(DESIGN_COMPONENT_REGISTRY)), evidenceChecksum: digest(JSON.stringify(sources)), sources }));
  return { root, git, publication, button, badge, baseRevision };
}

test("discovers and seals one approved product publication", async t => {
  const f = await fixture(); t.after(() => fs.rm(f.root, { recursive: true, force: true }));
  assert.equal(await discoverProductPublication(f.root), f.publication);
  assert.equal(await discoverProductPublication(f.root, f.baseRevision), f.publication);
  const result = await verifyProductPublication(f.publication, f.root);
  assert.equal(result.proposalId, "12345678-1234-1234-1234-123456789abc");
  assert.equal(result.sourceChanges[0].afterSha256, digest("export const Button = () => 'after';\n"));
});

test("direct governed changes without an approved handoff fail the push gate", async t => {
  const f = await fixture(); t.after(() => fs.rm(f.root, { recursive: true, force: true }));
  f.git("rm", f.publication); f.git("commit", "--quiet", "-m", "remove handoff");
  await assert.rejects(() => discoverProductPublication(f.root, f.baseRevision), /without an approved publication handoff/);
});

test("worktree edits to a committed approval export cannot change the verified handoff", async t => {
  const f = await fixture(); t.after(() => fs.rm(f.root, { recursive: true, force: true }));
  await fs.writeFile(path.join(f.root, f.publication), "invalid local overwrite");
  assert.equal((await verifyProductPublication(f.publication, f.root)).proposalId, "12345678-1234-1234-1234-123456789abc");
});

test("rejects an unapproved governed source change", async t => {
  const f = await fixture(); t.after(() => fs.rm(f.root, { recursive: true, force: true }));
  await fs.writeFile(path.join(f.root, f.badge), "export const Badge = () => 'changed';\n");
  f.git("add", f.badge); f.git("commit", "--quiet", "-m", "unapproved");
  await assert.rejects(() => verifyProductPublication(f.publication, f.root), /Unapproved governed product change/);
});

test("rejects tampered build evidence", async t => {
  const f = await fixture(); t.after(() => fs.rm(f.root, { recursive: true, force: true }));
  const evidencePath = path.join(f.root, "dist/design-component-source-evidence.json");
  const evidence = JSON.parse(await fs.readFile(evidencePath, "utf8")); evidence.sources[1].sha256 = "0".repeat(64);
  await fs.writeFile(evidencePath, JSON.stringify(evidence));
  await assert.rejects(() => verifyProductPublication(f.publication, f.root), /evidence is invalid/);
});

test("uses GitHub OIDC and the fixed Foundation origin", async () => {
  const previousUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, previousToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = "https://oidc.example/token?job=1"; process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = "request-token";
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return calls.length === 1 ? Response.json({ value: "oidc-token" }) : Response.json({ id: "publication-1" });
  };
  try {
    assert.deepEqual(await publicationApi("prepare", { proposalId: "p" }, fetcher as typeof fetch), { id: "publication-1" });
    assert.match(calls[0].url, /audience=https%3A%2F%2Fzaylist-foundation-library/);
    assert.equal((calls[1].init?.headers as Record<string, string>).authorization, "Bearer oidc-token");
    assert.equal((calls[1].init?.headers as Record<string, string>).origin, "https://zaylist-foundation-library.maxmackpdx.workers.dev");
  } finally {
    if (previousUrl === undefined) delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL; else process.env.ACTIONS_ID_TOKEN_REQUEST_URL = previousUrl;
    if (previousToken === undefined) delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN; else process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = previousToken;
  }
});
