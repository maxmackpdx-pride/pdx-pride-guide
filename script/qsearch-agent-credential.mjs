import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, lstatSync, chmodSync, renameSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

export const DEFAULT_CREDENTIAL_DIR = path.join(homedir(), "Library", "Application Support", "Zaylist", "QSearch Agent");

function privateDirectory(directory, create = false) {
  if (create) mkdirSync(directory, { recursive: true, mode: 0o700 });
  const info = lstatSync(directory);
  if (!info.isDirectory() || info.isSymbolicLink() || (process.getuid && info.uid !== process.getuid())) {
    throw new Error("QSearch's private state directory is not owned by this user.");
  }
  if ((info.mode & 0o077) !== 0) {
    if (!create) throw new Error("QSearch's private state directory must be owner-only (0700).");
    chmodSync(directory, 0o700);
  }
}

function privatePath(name, directory) {
  if (!/^[a-z][a-z0-9.-]*$/.test(name)) throw new Error("Invalid QSearch state name.");
  return path.join(directory, name);
}

export function readPrivateState(name, directory = DEFAULT_CREDENTIAL_DIR) {
  privateDirectory(directory);
  const file = privatePath(name, directory);
  const info = lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink() || (process.getuid && info.uid !== process.getuid()) || (info.mode & 0o077) !== 0) {
    throw new Error("QSearch's private state file must be owner-only (0600).");
  }
  return readFileSync(file, "utf8").trim();
}

export function writePrivateState(name, value, directory = DEFAULT_CREDENTIAL_DIR) {
  privateDirectory(directory, true);
  const file = privatePath(name, directory);
  const temporary = privatePath(`${name}.${randomUUID()}`, directory);
  try {
    writeFileSync(temporary, value, { mode: 0o600, flag: "wx" });
    renameSync(temporary, file);
  } catch (error) {
    try { unlinkSync(temporary); } catch { /* no temporary file remained */ }
    throw error;
  }
}

export function deletePrivateState(name, directory = DEFAULT_CREDENTIAL_DIR) {
  privateDirectory(directory);
  unlinkSync(privatePath(name, directory));
}
