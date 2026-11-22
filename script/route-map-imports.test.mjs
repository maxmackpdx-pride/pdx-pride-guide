import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "client/src");
const parsed = new Map();

function source(file) {
  if (!parsed.has(file)) parsed.set(file, ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true));
  return parsed.get(file);
}

function resolve(specifier, importer) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(client, specifier.slice(2));
  else if (specifier.startsWith("@shared/")) base = path.join(root, "shared", specifier.slice(8));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(importer), specifier);
  else return;
  return ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx"].map(ext => base + ext)
    .find(file => /\.[jt]sx?$/.test(file) && fs.existsSync(file) && fs.statSync(file).isFile());
}

function staticRuntimeSpecifier(statement) {
  if (ts.isImportDeclaration(statement)) {
    const clause = statement.importClause;
    if (clause?.isTypeOnly) return;
    const bindings = clause?.namedBindings;
    if (!clause?.name && bindings && ts.isNamedImports(bindings) && bindings.elements.length && bindings.elements.every(item => item.isTypeOnly)) return;
  } else if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly) return;
    if (statement.exportClause && ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.every(item => item.isTypeOnly)) return;
  } else return;
  const specifier = statement.moduleSpecifier;
  if (specifier && ts.isStringLiteral(specifier)) return specifier.text;
}

for (const entry of ["main.tsx", "pages/Home.tsx", "pages/Events.tsx", "pages/Directory.tsx"]) {
  test(entry + " defers map engine loading", () => {
    const queue = [[path.join(client, entry), []]], seen = new Set();
    while (queue.length) {
      const [file, chain] = queue.pop();
      if (seen.has(file)) continue;
      seen.add(file);
      for (const statement of source(file).statements) {
        const specifier = staticRuntimeSpecifier(statement);
        if (!specifier) continue;
        const pathToDependency = [...chain, path.relative(root, file)];
        assert.doesNotMatch(specifier, /^(?:maplibre-gl(?:\/|$)|@maplibre\/)/, pathToDependency.concat(specifier).join(" -> "));
        const target = resolve(specifier, file);
        if (target) queue.push([target, pathToDependency]);
      }
    }
  });
}

test("product map imports use the current engine", () => {
  const retired = /^(?:leaflet|react-leaflet|@react-leaflet\/core|@maplibre\/maplibre-gl-leaflet)(?:\/|$)/;
  function checkTree(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) checkTree(file);
      else if (/\.[jt]sx?$/.test(file)) {
        const visit = node => {
          const module = ts.isImportDeclaration(node) || ts.isExportDeclaration(node) ? node.moduleSpecifier
            : ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require")) ? node.arguments[0] : undefined;
          if (module && ts.isStringLiteralLike(module)) assert.doesNotMatch(module.text, retired, path.relative(root, file));
          ts.forEachChild(node, visit);
        };
        visit(source(file));
      }
    }
  }
  checkTree(client);
});
