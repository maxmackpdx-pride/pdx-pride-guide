#!/usr/bin/env node
// Railway runs this before building or serving a pushed production commit.
// A GitHub check alone is too late: Railway watches master independently.
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildDesignComponentSourceEvidence } from "./design-component-source-evidence";
import { DESIGN_COMPONENT_REGISTRY } from "../shared/designComponentRegistry";

const PRODUCT = "https://www.zaylist.com/api/design-system/v1/components";
const FOUNDATION = "https://zaylist-foundation-library.maxmackpdx.workers.dev";
const BOOTSTRAP_REGISTRY = "36373cdafc1382b60431f0b84452d6f2f49371b22698ac7b2f12fa78fe80b4d0";
const BOOTSTRAP_SOURCES = "eade108537e018d73c138108e6b8a9f05312a8587c148e1e841eb9bbc3dd069f";
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const hash = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const sha = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{40}$/.test(value);

type Evidence = Awaited<ReturnType<typeof buildDesignComponentSourceEvidence>>;
type Live = { sourceRepository: string; sourceRevision: string; sourceRevisionVerified: true; registryChecksum: string; sourceEvidence: Evidence };
type Manifest = { id: string; status: string; checksum: string; lastEventId: number; events: Array<{ kind: string }>;
  payload: { target: { repository: string; baseRevision: string; registryChecksum: string };
    sourceChanges: Array<{ path: string; beforeSha256: string | null; after: string | null }> } };

async function boundedJson(response: Response, limit = 256_000): Promise<unknown> {
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json") || Number(response.headers.get("content-length")) > limit)
    throw new Error("Design evidence is unavailable.");
  const body = await response.text();
  if (Buffer.byteLength(body) > limit) throw new Error("Design evidence is too large.");
  return JSON.parse(body);
}

export function evaluateRailwayDesignBuild(local: Evidence, live: Live, manifests: Manifest[], revision: string) {
  if (!sha(revision) || live.sourceRepository !== "maxmackpdx-pride/pdx-pride-guide" || live.sourceRevisionVerified !== true || !sha(live.sourceRevision) ||
      !hash(live.registryChecksum) || live.registryChecksum !== local.registryChecksum ||
      live.sourceEvidence?.registryChecksum !== live.registryChecksum || !hash(live.sourceEvidence?.evidenceChecksum) ||
      !Array.isArray(live.sourceEvidence?.sources) ||
      new Set(live.sourceEvidence.sources.map(source => source.path)).size !== live.sourceEvidence.sources.length ||
      DESIGN_COMPONENT_REGISTRY.some(component => !live.sourceEvidence.sources.some(source => source.path === component.sourcePath)) ||
      live.sourceEvidence.sources.some(source => typeof source.path !== "string" || !/^client\/src\/components\/[A-Za-z0-9_./-]+\.(tsx|css)$/.test(source.path) || source.path.includes("..") || !hash(source.sha256)) ||
      digest(JSON.stringify(live.sourceEvidence.sources)) !== live.sourceEvidence.evidenceChecksum)
    throw new Error("The live product design registry is not trustworthy or has changed identity.");
  const current = new Map(local.sources.map(item => [item.path, item.sha256]));
  const previous = new Map(live.sourceEvidence.sources.map(item => [item.path, item.sha256]));
  const changed = [...new Set([...current.keys(), ...previous.keys()])].filter(file => current.get(file) !== previous.get(file)).sort();
  if (!changed.length) return { authorized: true, bootstrap: false, changed };
  const candidates = manifests.filter(proposal => proposal.status === "approved" && proposal.events?.at(-1)?.kind === "approved" &&
    proposal.payload?.target?.repository === "maxmackpdx-pride/pdx-pride-guide" && proposal.payload.target.baseRevision === live.sourceRevision &&
    proposal.payload.target.registryChecksum === live.registryChecksum && digest(JSON.stringify(proposal.payload)) === proposal.checksum &&
    proposal.payload.sourceChanges?.length === changed.length && proposal.payload.sourceChanges.every(change =>
      changed.includes(change.path) && previous.get(change.path) === change.beforeSha256 &&
      (change.after === null ? !current.has(change.path) : digest(change.after) === current.get(change.path))));
  if (candidates.length !== 1) throw new Error("Changed canonical product sources require one exact approved design handoff.");
  const proposal = candidates[0];
  const proof = proposal.payload.sourceChanges.map(change => ({ path: change.path, beforeSha256: change.beforeSha256,
    afterSha256: change.after === null ? null : digest(change.after) })).sort((a, b) => a.path.localeCompare(b.path));
  return { authorized: false, bootstrap: false, changed, proposalId: proposal.id, proposalChecksum: proposal.checksum,
    sourceRevision: revision, graphChecksum: local.evidenceChecksum, sourceProofChecksum: digest(JSON.stringify(proof)) };
}

async function manifestsIn(root: string) {
  const directory = path.join(root, "design-publications/product");
  let names: string[];
  try { names = await fs.readdir(directory); } catch (error: any) { if (error.code === "ENOENT") return []; throw error; }
  if (names.length > 100) throw new Error("Too many product design handoffs.");
  return Promise.all(names.filter(name => /^[a-f0-9-]{36}\.json$/.test(name)).map(async name => {
    const file = path.join(directory, name), stat = await fs.lstat(file);
    if (!stat.isFile() || stat.size > 400_000) throw new Error("Invalid product design handoff file.");
    const proposal = JSON.parse(await fs.readFile(file, "utf8"));
    if (proposal.id !== name.slice(0, -5)) throw new Error("Product design handoff identity mismatch.");
    return proposal as Manifest;
  }));
}

export async function verifyRailwayDesignBuild(options: { root?: string; revision: string; fetcher?: typeof fetch; wait?: (ms: number) => Promise<void>; attempts?: number }) {
  const root = options.root ?? process.cwd(), fetcher = options.fetcher ?? fetch;
  const local = await buildDesignComponentSourceEvidence(root);
  if (!sha(options.revision)) throw new Error("Railway must supply the exact product commit SHA.");
  let live: Live;
  try {
    const response = await fetcher(PRODUCT, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(10_000) });
    live = await boundedJson(response) as Live;
  } catch (error) {
    if (local.registryChecksum === BOOTSTRAP_REGISTRY && local.evidenceChecksum === BOOTSTRAP_SOURCES) {
      return { authorized: true, bootstrap: true, changed: [] };
    }
    throw new Error("Live design evidence is unavailable; changed product sources cannot deploy.", { cause: error });
  }
  const result = evaluateRailwayDesignBuild(local, live, await manifestsIn(root), options.revision);
  if (result.authorized) return result;
  const url = new URL(`${FOUNDATION}/api/design/publication/authorization`);
  for (const name of ["proposalId", "proposalChecksum", "sourceRevision", "graphChecksum", "sourceProofChecksum"] as const)
    url.searchParams.set(name, String(result[name]));
  const attempts = options.attempts ?? 60, wait = options.wait ?? (ms => new Promise<void>(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetcher(url, { headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(10_000) });
      const authorization = await boundedJson(response, 1000);
      if (authorization && typeof authorization === "object" && (authorization as { authorized?: unknown }).authorized === true)
        return { ...result, authorized: true };
    } catch { /* A delayed GitHub preparation or brief network fault is not authorization. */ }
    if (attempt + 1 < attempts) await wait(5_000);
  }
  throw new Error("No current owner-approved product publication attests this exact commit and source change.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  verifyRailwayDesignBuild({ revision: process.env.RAILWAY_GIT_COMMIT_SHA ?? "" }).then(result => {
    console.log(`Railway design gate passed: ${result.bootstrap ? "sealed bootstrap" : result.changed.length ? "owner-approved source" : "unchanged canonical source"}.`);
  }).catch(error => { console.error(`Railway design gate blocked deployment: ${error.message}`); process.exitCode = 1; });
}
