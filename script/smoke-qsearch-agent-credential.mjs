import assert from "node:assert/strict";
import { mkdtempSync, lstatSync, chmodSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { deletePrivateState, readPrivateState, writePrivateState } from "./qsearch-agent-credential.mjs";

const directory = mkdtempSync(path.join(tmpdir(), "qsearch-credential-smoke-"));
try {
  writePrivateState("pending", "disposable-pending", directory);
  assert.equal(readPrivateState("pending", directory), "disposable-pending");
  assert.equal(lstatSync(path.join(directory, "pending")).mode & 0o777, 0o600);
  writePrivateState("pending", "disposable-updated", directory);
  assert.equal(readPrivateState("pending", directory), "disposable-updated");
  chmodSync(path.join(directory, "pending"), 0o644);
  assert.throws(() => readPrivateState("pending", directory), /owner-only/);
  deletePrivateState("pending", directory);
  symlinkSync(path.join(directory, "missing-target"), path.join(directory, "pending"));
  assert.throws(() => readPrivateState("pending", directory), /owner-only/);
  console.log("QSearch private credential storage checks passed.");
} finally {
  rmSync(directory, { recursive: true, force: true });
}
