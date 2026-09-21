import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DESIGN_COMPONENT_REGISTRY } from "../shared/designComponentRegistry";

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

export async function buildDesignComponentSourceEvidence(root = process.cwd()) {
  const tokenDirectory = "client/src/components/ds/tokens";
  const tokenFiles = (await readdir(path.join(root, tokenDirectory), { withFileTypes: true }))
    .filter(entry => entry.isFile() && /^[A-Za-z0-9_.-]+\.css$/.test(entry.name))
    .map(entry => `${tokenDirectory}/${entry.name}`);
  const paths = [...new Set([...DESIGN_COMPONENT_REGISTRY.map(component => component.sourcePath), ...tokenFiles])].sort();
  const sources = await Promise.all(paths.map(async sourcePath => ({ path: sourcePath, sha256: digest(await readFile(path.join(root, sourcePath))) })));
  const registryChecksum = digest(JSON.stringify(DESIGN_COMPONENT_REGISTRY));
  return { schemaVersion: 1 as const, registryChecksum, evidenceChecksum: digest(JSON.stringify(sources)), sources };
}

export async function writeDesignComponentSourceEvidence(root = process.cwd()) {
  const evidence = await buildDesignComponentSourceEvidence(root);
  const destination = path.join(root, "dist/design-component-source-evidence.json");
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, `${JSON.stringify(evidence)}\n`);
  return evidence;
}
