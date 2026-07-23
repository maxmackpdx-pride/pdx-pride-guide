/**
 * Flyer Reader validation harness — Phase 4 of the Flyer Reader.
 * Run (on Railway or locally with network + GROQ_API_KEY):
 *   npx tsx script/validate-flyers.ts [--limit N] [--json out.json]
 *
 * Pulls every flyer listed in flyers/ground-truth.json, runs the full
 * OCR → LLM pipeline, scores each field against the known values, and prints
 * a per-field + overall accuracy report. This is the ongoing test suite for
 * parser improvements: run it after any prompt/preprocessing change.
 *
 * Scoring:
 * - title/venue: normalized fuzzy match (case/punct-insensitive, ≥0.8 token overlap = hit)
 * - start_date/end_date: exact calendar day
 * - time: within 30 minutes
 * - address: street-number + street-name token match
 * - url: hostname match
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadFlyer } from "../server/flyerReader/github";
import { ocrFlyer } from "../server/flyerReader/ocr";
import { structureFlyer, type FlyerParse } from "../server/flyerReader/parse";

type GroundTruth = Record<string, Record<string, string | null>>;

const SCORED_FIELDS = ["title", "start_date", "end_date", "time", "venue", "address", "url"] as const;
type ScoredField = (typeof SCORED_FIELDS)[number];

function norm(s: string | null | undefined): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(norm(a).split(" ").filter(Boolean));
  const tb = new Set(norm(b).split(" ").filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach(t => {
    if (tb.has(t)) inter++;
  });
  return inter / Math.min(ta.size, tb.size);
}

function minutesOf(t: string | null): number | null {
  const m = String(t || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function scoreField(field: ScoredField, expected: string | null, actual: string | null): boolean | null {
  if (expected == null || expected === "") return null; // not scored
  if (actual == null || actual === "") return false;
  switch (field) {
    case "title":
    case "venue":
      return tokenOverlap(expected, actual) >= 0.8;
    case "start_date":
    case "end_date":
      return String(expected).slice(0, 10) === String(actual).slice(0, 10);
    case "time": {
      const e = minutesOf(expected);
      const a = minutesOf(actual);
      return e != null && a != null && Math.abs(e - a) <= 30;
    }
    case "address": {
      const numE = String(expected).match(/\d{1,5}/)?.[0];
      const numA = String(actual).match(/\d{1,5}/)?.[0];
      return Boolean(numE && numE === numA && tokenOverlap(expected, actual) >= 0.5);
    }
    case "url": {
      const host = (raw: string): string | null => {
        const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        try {
          return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
        } catch {
          return null;
        }
      };
      const he = host(String(expected));
      const ha = host(String(actual));
      return Boolean(he && ha && he === ha);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitIdx = args.indexOf("--limit");
  // Spend ceiling: never more than FLYER_VALIDATE_MAX vision calls per run
  // (default 25) regardless of ground-truth size; --limit can only lower it.
  const hardCap = Math.max(1, Number(process.env.FLYER_VALIDATE_MAX) || 25);
  const limit = Math.min(
    limitIdx >= 0 ? Number(args[limitIdx + 1]) || hardCap : hardCap,
    hardCap,
  );
  const jsonIdx = args.indexOf("--json");
  const jsonOut = jsonIdx >= 0 ? args[jsonIdx + 1] : null;

  const gtPath = path.join(process.cwd(), "flyers", "ground-truth.json");
  if (!existsSync(gtPath)) {
    console.error(
      "No flyers/ground-truth.json found. Copy ground-truth.example.json, add real flyers + values, rerun.",
    );
    process.exit(1);
  }
  const truth: GroundTruth = JSON.parse(readFileSync(gtPath, "utf8"));
  const entries = Object.entries(truth).slice(0, limit);
  if (!entries.length) {
    console.error("ground-truth.json is empty.");
    process.exit(1);
  }

  const perField: Record<string, { hit: number; scored: number }> = {};
  for (const f of SCORED_FIELDS) perField[f] = { hit: 0, scored: 0 };
  const results: Array<{
    path: string;
    ok: boolean;
    error?: string;
    ocrConfidence?: number;
    parseConfidence?: number;
    model?: string | null;
    warnings?: string[];
    fields?: Record<string, { expected: string | null; actual: string | null; hit: boolean | null }>;
  }> = [];

  for (const [flyerPath, expected] of entries) {
    process.stdout.write(`\n▸ ${flyerPath}\n`);
    try {
      const flyer = await loadFlyer(flyerPath);
      const ocr = await ocrFlyer(flyer.buffer);
      const parse: FlyerParse = await structureFlyer({
        imageBuffer: flyer.buffer,
        rawText: ocr.text,
        ocrConfidence: ocr.confidence,
      });

      const fields: Record<string, { expected: string | null; actual: string | null; hit: boolean | null }> = {};
      for (const f of SCORED_FIELDS) {
        const exp = (expected[f] ?? null) as string | null;
        const act = (parse[f] ?? null) as string | null;
        const hit = scoreField(f, exp, act);
        fields[f] = { expected: exp, actual: act, hit };
        if (hit != null) {
          perField[f].scored++;
          if (hit) perField[f].hit++;
        }
        if (hit != null) {
          process.stdout.write(
            `  ${hit ? "✓" : "✗"} ${f}: expected ${JSON.stringify(exp)} got ${JSON.stringify(act)}\n`,
          );
        }
      }
      // Which engine actually answered + why fallbacks happened — without
      // this, a dead vision model silently grades as a text-path regression.
      if (parse.model) process.stdout.write(`  model: ${parse.model}\n`);
      for (const w of parse.warnings || []) process.stdout.write(`  ! ${w}\n`);
      results.push({
        path: flyerPath,
        ok: true,
        ocrConfidence: ocr.confidence,
        parseConfidence: parse.confidence,
        model: parse.model,
        warnings: parse.warnings,
        fields,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(`  ERROR: ${message}\n`);
      results.push({ path: flyerPath, ok: false, error: message });
    }
  }

  console.log("\n══ Field accuracy ══");
  let totalHit = 0;
  let totalScored = 0;
  for (const f of SCORED_FIELDS) {
    const { hit, scored } = perField[f];
    totalHit += hit;
    totalScored += scored;
    if (scored) console.log(`  ${f.padEnd(11)} ${hit}/${scored}  (${Math.round((100 * hit) / scored)}%)`);
  }
  const overall = totalScored ? Math.round((100 * totalHit) / totalScored) : 0;
  console.log(`\n  OVERALL     ${totalHit}/${totalScored}  (${overall}%)`);
  console.log(`  Flyers: ${results.filter(r => r.ok).length}/${entries.length} processed`);

  if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({ overall, perField, results }, null, 2));
    console.log(`  Report written: ${jsonOut}`);
  }

  process.exit(overall >= 70 || totalScored === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("FATAL:", err);
  process.exit(1);
});
