#!/usr/bin/env node
// Prepare exact product-source proposal JSON. Never uploads, approves, applies, or publishes.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const GUIDE_RELEASE = "https://zaylist-foundation-library.maxmackpdx.workers.dev/api/design/v1/release";
const PRODUCT_REGISTRY = "https://www.zaylist.com/api/design-system/v1/components";
const PRODUCT_REPOSITORY = "maxmackpdx-pride/pdx-pride-guide";
const hash = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const tokenPath = (value: string) => /^client\/src\/components\/ds\/tokens\/[A-Za-z0-9_.-]+\.css$/.test(value);

async function json(fetcher: typeof fetch, url: string) {
  const response = await fetcher(url, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(10_000) });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error(`Verified design source unavailable: ${url}`);
  const text = await response.text();
  if (Buffer.byteLength(text) > 300_000) throw new Error("Verified design response is too large.");
  return JSON.parse(text);
}

export async function prepareProductDesignProposal({ root, files, title, rationale, recordIds, fetcher = fetch }: {
  root: string; files: string[]; title: string; rationale: string; recordIds: string[]; fetcher?: typeof fetch;
}) {
  root = await fs.realpath(root);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 20_000_000, stdio: ["ignore", "pipe", "pipe"] });
  if (await fs.realpath(git("rev-parse", "--show-toplevel").trim()) !== root) throw new Error("Use the Zaylist product repository root.");
  const [release, registry] = await Promise.all([json(fetcher, GUIDE_RELEASE), json(fetcher, PRODUCT_REGISTRY)]);
  if (!release?.release?.id || !/^[a-f0-9]{64}$/.test(release.checksum) || registry?.sourceRepository !== PRODUCT_REPOSITORY ||
      !/^[a-f0-9]{40}$/.test(registry.sourceRevision) || !/^[a-f0-9]{64}$/.test(registry.registryChecksum) || !Array.isArray(registry.components)) {
    throw new Error("Verified Design API identity is invalid.");
  }
  git("cat-file", "-e", `${registry.sourceRevision}^{commit}`);
  git("merge-base", "--is-ancestor", registry.sourceRevision, "HEAD");
  const ids = [...new Set(recordIds)];
  const components = registry.components.filter((component: any) => ids.includes(component.id));
  if (!ids.length || components.length !== ids.length || ids.some(id => !/^component:/.test(id))) throw new Error("Every record ID must be a current production component identity.");
  const allowed = new Set(components.map((component: any) => component.sourcePath));
  const sourceChanges = [];
  for (const file of [...new Set(files)]) {
    if ((!allowed.has(file) && !tokenPath(file)) || file.includes("..") || path.isAbsolute(file)) throw new Error(`Not an owning source for the selected components: ${file}`);
    let before: Buffer | null = null;
    try { before = execFileSync("git", ["show", `${registry.sourceRevision}:${file}`], { cwd: root, maxBuffer: 20_000_000, stdio: ["ignore", "pipe", "pipe"] }); }
    catch { if (!tokenPath(file)) throw new Error(`Canonical source did not exist at the deployed revision: ${file}`); }
    let after: Buffer | null = null;
    try {
      const full = path.join(root, file), stat = await fs.lstat(full);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 160_000 || await fs.realpath(full) !== full) throw new Error(`Expected a regular source file up to 160KB: ${file}`);
      after = await fs.readFile(full);
      new TextDecoder("utf-8", { fatal: true }).decode(after);
    } catch (error: any) { if (error.code !== "ENOENT") throw error; }
    if (before?.equals(after ?? Buffer.alloc(0)) && after !== null) continue;
    if (before === null && after === null) throw new Error(`A missing source cannot be deleted: ${file}`);
    sourceChanges.push({ path: file, beforeSha256: before === null ? null : hash(before), after: after === null ? null : after.toString("utf8") });
  }
  if (!sourceChanges.length) throw new Error("No changed canonical source files were selected.");
  return { title, rationale, baseReleaseId: release.release.id, baseGraphChecksum: release.checksum, recordIds: ids,
    target: { repository: PRODUCT_REPOSITORY, baseRevision: registry.sourceRevision, registryChecksum: registry.registryChecksum }, sourceChanges };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2), files: string[] = [], recordIds: string[] = []; let title = "", rationale = "", root = process.cwd();
    if (args.includes("--help")) {
      console.log('Usage: npm run design:proposal -- --title "Change Button" --rationale "Why" --record-id component:forms/Button --file client/src/components/ds/Button.tsx');
      console.log("Prints exact proposal JSON only. It never uploads, approves, edits, or publishes.");
      process.exit(0);
    }
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i], value = args[i + 1]; if (!value) throw new Error(`Missing value for ${key}`);
      if (key === "--file") files.push(value); else if (key === "--record-id") recordIds.push(value); else if (key === "--title") title = value;
      else if (key === "--rationale") rationale = value; else if (key === "--source-root") root = value; else throw new Error(`Unknown option: ${key}`);
    }
    if (!title || !rationale || !files.length || !recordIds.length) throw new Error("Use --title, --rationale, --record-id and --file. This command only prints proposal JSON.");
    console.log(JSON.stringify(await prepareProductDesignProposal({ root, files, title, rationale, recordIds }), null, 2));
  } catch (error: any) { console.error(`Proposal not prepared: ${error.message}`); process.exitCode = 1; }
}
