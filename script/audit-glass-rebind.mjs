#!/usr/bin/env node
/**
 * Fail when a rule or inline style sets --c without rebinding glass recipes.
 *
 * Custom properties compute on the element where they are defined. Setting a
 * local --c without .pdx-glass-rebind (or a class in the official grouped
 * rebind rule in tokens/glass.css) leaves --glass-card-* stuck on root cyan.
 *
 * Usage: node script/audit-glass-rebind.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GLASS_CSS = join(ROOT, "client/src/components/ds/tokens/glass.css");
const SCAN_ROOTS = [
  join(ROOT, "client/src"),
];

const STYLE_EXTS = new Set([".css", ".ts", ".tsx"]);

/**
 * Known exceptions (keep short). Prefer adding .pdx-glass-rebind at the source.
 *
 * - :root / html / body: global default --c (the cyan fallback itself).
 * - Official grouped SELECTORS in tokens/glass.css (parsed from the recipe
 *   block, not a list of product offenders). That group is the card contract.
 *   Do not grow it to make this audit pass.
 * - client/src/components/ds/glass.ts: glass() / glassNeutral() bake fill,
 *   edge, and bloom inline with the same accent, so they do not consume
 *   inherited --glass-card-* recipes.
 * - <Button>: always attaches .pdxBtn.pdx-glass-rebind on the host node.
 */
const GLOBAL_SUBJECTS = new Set([":root", "html", "body", ":root[data-calm=\"true\"]", "html.calm-mode"]);

function walkFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === "dist" || name === "build") continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walkFiles(full, out);
    else if (STYLE_EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "));
}

function stripTsComments(src) {
  let out = "";
  let i = 0;
  while (i < src.length) {
    if (src.startsWith("//", i)) {
      const end = src.indexOf("\n", i);
      const take = end === -1 ? src.length - i : end - i;
      out += " ".repeat(take);
      i += take;
      continue;
    }
    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    const q = src[i];
    if (q === "'" || q === "\"" || q === "`") {
      let j = i + 1;
      while (j < src.length) {
        if (src[j] === "\\") {
          j += 2;
          continue;
        }
        if (src[j] === q) {
          j += 1;
          break;
        }
        if (q === "`" && src[j] === "$" && src[j + 1] === "{") {
          break;
        }
        j += 1;
      }
      out += src.slice(i, j);
      i = j;
      continue;
    }
    out += src[i];
    i += 1;
  }
  return out;
}

function splitSelectors(header) {
  const parts = [];
  let cur = "";
  let depth = 0;
  for (let i = 0; i < header.length; i++) {
    const ch = header[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      const t = cur.trim();
      if (t) parts.push(t);
      cur = "";
      continue;
    }
    cur += ch;
  }
  const t = cur.trim();
  if (t) parts.push(t);
  return parts;
}

function subjectOf(selector) {
  let s = selector.replace(/\s+/g, " ").trim();
  s = s.replace(/::[A-Za-z0-9_-]+(\([^)]*\))?/g, "");
  s = s.replace(/:(?!root\b|host\b)[A-Za-z0-9_-]+(\([^)]*\))?/g, "");
  const bits = s.split(/(?:[>+~]|\s)+/);
  return (bits[bits.length - 1] || s).trim();
}

function classesOf(subject) {
  return [...subject.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
}

function parseOfficialRebindGroup(glassSrc) {
  const src = stripCssComments(glassSrc);
  const marker = ".pdx-glass-rebind";
  const idx = src.indexOf(marker);
  if (idx < 0) {
    throw new Error(`Could not find ${marker} in ${relative(ROOT, GLASS_CSS)}`);
  }
  const brace = src.indexOf("{", idx);
  if (brace < 0) throw new Error("glass.css rebind rule is missing a block");
  const header = src.slice(idx, brace);
  const body = src.slice(brace, src.indexOf("}", brace) + 1);
  if (!body.includes("--glass-card-bg")) {
    throw new Error("glass.css rebind rule does not declare --glass-card-bg");
  }
  const selectors = splitSelectors(header);
  return selectors.map((sel) => ({
    raw: sel.replace(/\s+/g, " ").trim(),
    classes: classesOf(subjectOf(sel)),
  }));
}

function isGlobalSubject(subject) {
  const compact = subject.replace(/\s+/g, "");
  if (GLOBAL_SUBJECTS.has(subject) || GLOBAL_SUBJECTS.has(compact)) return true;
  if (/^:root\b/.test(subject) && classesOf(subject).length === 0) return true;
  if (/^(html|body)\b/.test(subject) && classesOf(subject).length === 0) return true;
  return false;
}

function subjectRebinds(subject, group) {
  if (isGlobalSubject(subject)) return true;
  const classes = classesOf(subject);
  if (classes.includes("pdx-glass-rebind")) return true;
  for (const entry of group) {
    if (entry.classes.length === 0) continue;
    if (entry.classes.length === 1) {
      const base = entry.classes[0];
      if (classes.includes(base)) return true;
      if (classes.some((c) => c.startsWith(`${base}--`))) return true;
      continue;
    }
    const ok = entry.classes.every(
      (need) => classes.includes(need) || classes.some((c) => c.startsWith(`${need}--`)),
    );
    if (ok) return true;
  }
  return false;
}

function extractOwnDeclarations(block) {
  let out = "";
  let depth = 0;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) out += ch;
  }
  return out;
}

function assignsAccentC(decls) {
  return /(?:^|[\s;{])--c\s*:/.test(decls);
}

function lineNumber(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src[i] === "\n") line += 1;
  }
  return line;
}

function walkCssRules(src, onRule) {
  const css = stripCssComments(src);
  const stack = [];
  let selStart = 0;
  let i = 0;
  const skipString = (q) => {
    i += 1;
    while (i < css.length) {
      if (css[i] === "\\") {
        i += 2;
        continue;
      }
      if (css[i] === q) {
        i += 1;
        return;
      }
      i += 1;
    }
  };
  while (i < css.length) {
    const ch = css[i];
    if (ch === "'" || ch === "\"") {
      skipString(ch);
      continue;
    }
    if (ch === "{") {
      const selector = css.slice(selStart, i).trim();
      stack.push({ selector, bodyStart: i + 1 });
      selStart = i + 1;
      i += 1;
      continue;
    }
    if (ch === "}") {
      const frame = stack.pop();
      if (frame && !frame.selector.startsWith("@")) {
        const decls = extractOwnDeclarations(css.slice(frame.bodyStart, i));
        if (assignsAccentC(decls)) {
          const resolved = resolveSelectors(stack, frame.selector);
          onRule({
            selectors: resolved,
            index: frame.bodyStart,
          });
        }
      }
      selStart = i + 1;
      i += 1;
      continue;
    }
    i += 1;
  }
}

function resolveSelectors(parentStack, header) {
  const parents = parentStack
    .map((f) => f.selector)
    .filter((s) => s && !s.startsWith("@"));
  const parentSel = parents.length ? parents.join(" ") : "";
  return splitSelectors(header).map((sel) => {
    let s = sel.trim();
    if (s.startsWith("&")) s = (parentSel + s.slice(1)).trim();
    else if (parentSel) s = `${parentSel} ${s}`;
    return s.replace(/\s+/g, " ").trim();
  });
}

function auditCssText(src, file, group, findings) {
  walkCssRules(src, ({ selectors, index }) => {
    for (const selector of selectors) {
      const subject = subjectOf(selector);
      if (subjectRebinds(subject, group)) continue;
      findings.push({
        file,
        line: lineNumber(src, index),
        kind: "css",
        selector,
        subject,
        message: `sets --c on \`${subject}\` without .pdx-glass-rebind (and not in the glass.css rebind group)`,
      });
    }
  });
}

function extractCssTemplates(src) {
  const out = [];
  const re = /(?:const\s+CSS\s*=\s*|css`)`([\s\S]*?)`/g;
  let m;
  while ((m = re.exec(src))) {
    out.push({ text: m[1], index: m.index });
  }
  return out;
}

function findJsxOpenTag(src, fromIndex) {
  let i = fromIndex;
  while (i >= 0) {
    if (src[i] === "<" && /[A-Za-z/]/.test(src[i + 1] || "")) {
      if (src[i + 1] === "/") {
        i -= 1;
        continue;
      }
      let j = i + 1;
      let quote = null;
      let depth = 0;
      while (j < src.length) {
        const ch = src[j];
        if (quote) {
          if (ch === "\\" && quote !== "`") {
            j += 2;
            continue;
          }
          if (ch === quote) quote = null;
          j += 1;
          continue;
        }
        if (ch === "'" || ch === "\"" || ch === "`") {
          quote = ch;
          j += 1;
          continue;
        }
        if (ch === "{") {
          depth += 1;
          j += 1;
          continue;
        }
        if (ch === "}") {
          depth = Math.max(0, depth - 1);
          j += 1;
          continue;
        }
        if (depth === 0 && ch === ">") {
          return { start: i, end: j + 1, text: src.slice(i, j + 1) };
        }
        j += 1;
      }
      return null;
    }
    i -= 1;
  }
  return null;
}

function classNameFromJsx(tagText) {
  const m = tagText.match(/\bclassName\s*=\s*(\{[\s\S]*?\}|"[^"]*"|'[^']*'|`[^`]*`)/);
  return m ? m[1] : "";
}

function classBlobRebinds(blob, group) {
  if (!blob) return false;
  if (/\bpdx-glass-rebind\b/.test(blob)) return true;
  const classes = [...blob.matchAll(/[A-Za-z0-9_-]+/g)].map((m) => m[0]);
  const fakeSubject = classes.map((c) => `.${c}`).join("");
  return subjectRebinds(fakeSubject, group);
}

/** Components that always attach .pdx-glass-rebind (or a rebind-group class). */
const REBIND_HOST_TAGS = new Set(["Button"]);

function tagNameOf(tagText) {
  const m = tagText.match(/^<\s*([A-Za-z][A-Za-z0-9._-]*)/);
  return m ? m[1] : "";
}

function resolveClassNameBlob(tagText, src, tagStart) {
  const raw = classNameFromJsx(tagText);
  if (!raw) return raw;
  const ident = raw.match(/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (!ident) return raw;
  const name = ident[1];
  const before = src.slice(0, tagStart);
  const re = new RegExp(
    `(?:const|let|var)\\s+${name}\\s*=\\s*([\\s\\S]*?)(?:;\\n|\\n\\s*return\\b)`,
    "g",
  );
  let last = null;
  let m;
  while ((m = re.exec(before))) last = m[1];
  return last ? `${raw}\n${last}` : raw;
}

const TSX_C_ASSIGN = /(?:\[\s*["']--c["']\s+as\s+\w+\s*\]|(['"`])--c\1|(?<![\w-])--c)(\s*:)/g;

function auditTsx(src, file, group, findings) {
  const rel = relative(ROOT, file);
  if (rel.replace(/\\/g, "/") === "client/src/components/ds/glass.ts") return;

  const stripped = stripTsComments(src);
  for (const tpl of extractCssTemplates(src)) {
    auditCssText(tpl.text, file, group, findings);
  }

  const seen = new Set();
  let m;
  TSX_C_ASSIGN.lastIndex = 0;
  while ((m = TSX_C_ASSIGN.exec(stripped))) {
    const i = m.index;
    const line = lineNumber(src, i);
    const key = `${line}`;
    if (seen.has(key)) continue;
    const tag = findJsxOpenTag(stripped, i);
    if (!tag) continue;
    if (i < tag.start || i > tag.end) continue;
    seen.add(key);
    if (REBIND_HOST_TAGS.has(tagNameOf(tag.text))) continue;
    const blob = resolveClassNameBlob(tag.text, src, tag.start);
    if (classBlobRebinds(blob, group)) continue;
    const open = tag.text.slice(0, 80).replace(/\s+/g, " ");
    findings.push({
      file,
      line,
      kind: "tsx",
      selector: open,
      subject: blob || "(no className)",
      message: `inline --c without pdx-glass-rebind (or a glass.css rebind-group class) on the same element`,
    });
  }
}

function main() {
  const glassSrc = readFileSync(GLASS_CSS, "utf8");
  const group = parseOfficialRebindGroup(glassSrc);
  const files = SCAN_ROOTS.flatMap((dir) => walkFiles(dir));
  const findings = [];

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const ext = extname(file);
    if (ext === ".css") auditCssText(src, file, group, findings);
    else auditTsx(src, file, group, findings);
  }

  findings.sort((a, b) => {
    const fa = relative(ROOT, a.file).localeCompare(relative(ROOT, b.file));
    if (fa !== 0) return fa;
    return a.line - b.line;
  });

  if (findings.length === 0) {
    console.log(`glass-rebind audit: 0 violations (${files.length} files, ${group.length} rebind-group selectors)`);
    return;
  }

  console.error(`glass-rebind audit: ${findings.length} violation(s)\n`);
  for (const f of findings) {
    const loc = `${relative(ROOT, f.file)}:${f.line}`;
    console.error(`${loc}: ${f.message}`);
    if (f.kind === "css") console.error(`  selector: ${f.selector}`);
    else console.error(`  element: ${f.selector}`);
  }
  console.error(`\nAdd .pdx-glass-rebind on the same node that sets --c, or use a class from the official group in ${relative(ROOT, GLASS_CSS)}.`);
  process.exit(1);
}

main();
