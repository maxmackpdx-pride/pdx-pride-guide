import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const client = fileURLToPath(new URL("../client/src/", import.meta.url));
// The call site must use the public hook or a component owning that hook.
// These are the independent heart-bearing presentations in this build.
const consumers = {
  "components/events/EventFlyerFront.tsx": ["useHeart", "EventFrontHeart"],
  "components/events/EventParticipation.tsx": ["useHeart"],
  "components/events/EventSquareCard.tsx": ["EventFrontHeart"],
  "components/events/EventRailCard.tsx": ["EventFrontHeart"],
  "components/home/TonightEventCard.tsx": ["EventFrontHeart"],
  "components/events/EventzExpanded.tsx": ["EventInterestedHeart"],
  "components/places/PlacezMapDrawer.tsx": ["DrawerTop"],
  "components/outz/OutzideDrawer.tsx": ["DrawerTop"],
  "components/events/EventsFilterDrawer.tsx": ["DrawerTop"],
  "components/places/PlacezInViewRail.tsx": ["DrawerMiniCard"],
  "components/places/PlacezEventsRails.tsx": ["DrawerMiniCard"],
};
const owners = { DrawerTop: "components/drawers", DrawerMiniCard: "components/drawers", useHeart: "hooks/useHearts", EventFrontHeart: "events/EventParticipation", EventInterestedHeart: "events/EventParticipation" };

export async function auditInterestApi() {
  const findings = [];
  const remaining = new Set(Object.keys(consumers));
  for (const entry of await readdir(client, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !/\.tsx?$/.test(entry.name) || /\.test\./.test(entry.name)) continue;
    const path = join(entry.parentPath, entry.name);
    const file = relative(client, path);
    remaining.delete(file);
    const text = await readFile(path, "utf8");
    if (!text.includes("/api/hearts") && !(file in consumers)) continue;
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const imports = new Set();
    for (const node of ast.statements) {
      if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      const bindings = node.importClause?.namedBindings;
      if (!bindings || !ts.isNamedImports(bindings)) continue;
      for (const binding of bindings.elements) {
        const name = (binding.propertyName || binding.name).text;
        const owner = owners[name];
        const module = node.moduleSpecifier.text;
        // Relative imports bind to the consumer's directory.
        const source = module.startsWith(".") ? join(file, "..", module) : module;
        if (consumers[file]?.includes(name) && source.endsWith(owner)) imports.add(binding.name.text);
      }
    }
    let usesOwner = false;
    function visit(node) {
      if (ts.isCallExpression(node)) {
        const name = node.expression.getText(ast);
        if (imports.has(name)) usesOwner = true;
        const [first, second] = node.arguments;
        const endpoint = name === "apiRequest" ? second : first;
        if (file !== "hooks/useHearts.ts" && endpoint && ts.isStringLiteralLike(endpoint) && endpoint.text === "/api/hearts") {
          const method = name === "apiRequest" ? first?.getText(ast) : second?.getText(ast);
          if (method && /\b(?:POST|PUT|PATCH|DELETE)\b/i.test(method))
            findings.push(`${file}:${ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1} writes hearts outside useHeart`);
        }
      }
      if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && imports.has(node.tagName.getText(ast))) usesOwner = true;
      ts.forEachChild(node, visit);
    }
    visit(ast);
    if (file in consumers && !usesOwner) findings.push(`${file} does not consume its shared API`);
  }
  for (const file of remaining) findings.push(`Missing expected API consumer ${file}`);
  return findings;
}
