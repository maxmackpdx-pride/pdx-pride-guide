#!/usr/bin/env node
// Product publication handoff. This verifies an exported owner approval and
// talks to the Foundation attestation API. It never grants approval.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { DESIGN_COMPONENT_REGISTRY } from "../shared/designComponentRegistry";

const FOUNDATION = "https://zaylist-foundation-library.maxmackpdx.workers.dev";
const AUDIENCE = `${FOUNDATION}/api/design/publication`;
const PRODUCT_REPOSITORY = "maxmackpdx-pride/pdx-pride-guide";
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const uuid = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const tokenPath = (value: string) => /^client\/src\/components\/ds\/tokens\/[A-Za-z0-9_.-]+\.css$/.test(value);
const handoffPath = (id: string) => `design-publications/product/${id}.json`;
const REGISTRY_CHECKSUM = digest(JSON.stringify(DESIGN_COMPONENT_REGISTRY));
const COMPONENT_PATHS = new Set(DESIGN_COMPONENT_REGISTRY.map(component => component.sourcePath));

function git(root: string, ...args: string[]) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 20_000_000, stdio: ["ignore", "pipe", "pipe"] });
}
function readGit(root: string, ref: string, file: string): Buffer | null {
  try { return execFileSync("git", ["show", `${ref}:${file}`], { cwd: root, maxBuffer: 20_000_000, stdio: ["ignore", "pipe", "pipe"] }); }
  catch { return null; }
}

export async function discoverProductPublication(root = process.cwd(), before?: string) {
  if (before && !/^[a-f0-9]{40}$/.test(before)) throw new Error("A valid previous product commit is required.");
  const changed = before
    ? git(root, "diff", "--name-only", "--no-renames", before, "HEAD", "--").trim().split("\n").filter(Boolean)
    : git(root, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD").trim().split("\n").filter(Boolean);
  const files = changed.filter(file => /^design-publications\/product\/[a-f0-9-]{36}\.json$/.test(file));
  if (files.length > 1) throw new Error("A deployment may carry at most one product design publication.");
  if (!files.length && changed.some(file => COMPONENT_PATHS.has(file) || tokenPath(file))) throw new Error("Governed product source changed without an approved publication handoff.");
  return files[0] ?? "";
}

export async function verifyProductPublication(proposalFile: string, root = process.cwd()) {
  root = await fs.realpath(root);
  if (await fs.realpath(git(root, "rev-parse", "--show-toplevel").trim()) !== root || git(root, "rev-parse", "HEAD").trim().length !== 40) throw new Error("Verify the checked-out product repository HEAD only.");
  const bytes = readGit(root, "HEAD", proposalFile);
  if (!bytes || git(root, "ls-tree", "HEAD", "--", proposalFile).trim().startsWith("100644 blob ") === false) throw new Error("Use a committed regular-file proposal export.");
  if (bytes.length > 400_000) throw new Error("Approved proposal export is too large.");
  const proposal = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  if (!uuid(proposal?.id) || proposalFile !== handoffPath(proposal.id) || proposal.status !== "approved" || proposal.lastEventId < 1 ||
      proposal.events?.at(-1)?.kind !== "approved" || proposal.payload?.target?.repository !== PRODUCT_REPOSITORY ||
      !/^[a-f0-9]{40}$/.test(proposal.payload.target.baseRevision) || !/^[a-f0-9]{64}$/.test(proposal.payload.target.registryChecksum) ||
      digest(JSON.stringify(proposal.payload)) !== proposal.checksum || !Array.isArray(proposal.payload.sourceChanges) || !proposal.payload.sourceChanges.length) throw new Error("Use the exact currently approved product proposal export.");
  const base = proposal.payload.target.baseRevision;
  git(root, "cat-file", "-e", `${base}^{commit}`); git(root, "merge-base", "--is-ancestor", base, "HEAD");
  const selected = new Set<string>();
  const sourceChanges = proposal.payload.sourceChanges.map((change: any) => {
    if (!change || typeof change.path !== "string" || selected.has(change.path) || !COMPONENT_PATHS.has(change.path) && !tokenPath(change.path)) throw new Error(`Invalid approved product source: ${change?.path}`);
    selected.add(change.path);
    const before = readGit(root, base, change.path), after = readGit(root, "HEAD", change.path);
    const afterText = after === null ? null : new TextDecoder("utf-8", { fatal: true }).decode(after);
    if ((before === null ? null : digest(before)) !== change.beforeSha256 || afterText !== change.after || (before === null && after === null)) throw new Error(`Committed source differs from approval: ${change.path}`);
    return { path: change.path, beforeSha256: change.beforeSha256, afterSha256: after === null ? null : digest(after) };
  }).sort((a: any, b: any) => a.path.localeCompare(b.path));
  for (const file of git(root, "diff", "--name-only", "--no-renames", base, "HEAD", "--", "client/src/components").trim().split("\n").filter(Boolean)) {
    if ((COMPONENT_PATHS.has(file) || tokenPath(file)) && !selected.has(file)) throw new Error(`Unapproved governed product change: ${file}`);
  }
  const protectedFiles = [".github/workflows/railway-deploy.yml", "railway.json", "script/design-product-publication.ts", "script/verify-railway-design-build.ts", "script/design-component-source-evidence.ts", "script/build.ts", "server/routes.ts"];
  if (git(root, "diff", "--name-only", base, "HEAD", "--", ...protectedFiles).trim()) throw new Error("Publication or evidence machinery changed after the approved baseline.");
  const evidence = JSON.parse(await fs.readFile(path.join(root, "dist/design-component-source-evidence.json"), "utf8"));
  if (evidence?.schemaVersion !== 1 || evidence.registryChecksum !== REGISTRY_CHECKSUM || !Array.isArray(evidence.sources) ||
      digest(JSON.stringify(evidence.sources)) !== evidence.evidenceChecksum) throw new Error("Built product source evidence is invalid.");
  const evidenceMap = new Map(evidence.sources?.map((source: any) => [source.path, source.sha256]));
  for (const source of sourceChanges) if (source.afterSha256 === null ? evidenceMap.has(source.path) : evidenceMap.get(source.path) !== source.afterSha256) throw new Error(`Built source seal differs from approval: ${source.path}`);
  return { proposalId: proposal.id, proposalChecksum: proposal.checksum, approvalEventId: proposal.lastEventId,
    releaseId: `zaylist-product-design-${proposal.id}`, graphChecksum: evidence.evidenceChecksum, sourceChanges };
}

async function oidcToken(fetcher: typeof fetch) {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL, requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) throw new Error("GitHub OIDC is unavailable.");
  const url = new URL(requestUrl); url.searchParams.set("audience", AUDIENCE);
  const response = await fetcher(url, { headers: { authorization: `Bearer ${requestToken}`, accept: "application/json" }, redirect: "error" });
  const body = await response.json(); if (!response.ok || typeof body?.value !== "string") throw new Error("GitHub OIDC token request failed.");
  return body.value;
}

export async function publicationApi(action: "prepare" | "complete" | "fail", body: unknown, fetcher: typeof fetch = fetch) {
  const token = await oidcToken(fetcher);
  const response = await fetcher(`${FOUNDATION}/api/design/publication/${action}`, { method: "POST", redirect: "error",
    headers: { authorization: `Bearer ${token}`, origin: FOUNDATION, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
  const result = await response.json(); if (!response.ok) throw new Error(typeof result?.error === "string" ? result.error : `Publication ${action} failed.`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [command, ...args] = process.argv.slice(2), option = (name: string) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
    if (command === "discover") console.log(await discoverProductPublication(process.cwd(), process.env.BEFORE_SHA));
    else if (command === "verify") { const file = option("--proposal"), output = option("--output"); if (!file || !output) throw new Error("verify requires --proposal and --output"); await fs.writeFile(output, `${JSON.stringify(await verifyProductPublication(file))}\n`); }
    else if (command === "prepare") { const input = option("--input"), output = option("--output"); if (!input || !output) throw new Error("prepare requires --input and --output"); await fs.writeFile(output, `${JSON.stringify(await publicationApi("prepare", JSON.parse(await fs.readFile(input, "utf8"))))}\n`); }
    else if (command === "complete") { const state = option("--state"); if (!state) throw new Error("complete requires --state"); const publication = JSON.parse(await fs.readFile(state, "utf8")); console.log(JSON.stringify(await publicationApi("complete", { publicationId: publication.id }))); }
    else if (command === "fail") { const state = option("--state"), reason = option("--reason"); if (!state || !reason) throw new Error("fail requires --state and --reason"); const publication = JSON.parse(await fs.readFile(state, "utf8")); console.log(JSON.stringify(await publicationApi("fail", { publicationId: publication.id, reason }))); }
    else throw new Error("Use discover, verify, prepare, complete, or fail.");
  } catch (error: any) { console.error(`Product publication failed: ${error.message}`); process.exitCode = 1; }
}
