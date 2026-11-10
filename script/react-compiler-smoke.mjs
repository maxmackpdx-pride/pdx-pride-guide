import assert from "node:assert/strict";
import { transformAsync } from "@babel/core";

/**
 * Isolated compiler integration smoke. Production cards and Mapz are not imported.
 * Proves the stable Babel compiler actually transforms annotated React JSX.
 * This alone is not a UI profile or browser regression pass.
 */
async function compile(directive) {
  const source = `
    import React from "react";
    export function CardExample({ items }) {
      "${directive}";
      const titles = items.map(item => item.title.toUpperCase());
      return <div>{titles.join(", ")}</div>;
    }
  `;
  const result = await transformAsync(source, {
    filename: "react-compiler-card-smoke.jsx",
    configFile: false,
    babelrc: false,
    parserOpts: { sourceType: "module", plugins: ["jsx"] },
    plugins: [["babel-plugin-react-compiler", { compilationMode: "annotation" }]],
  });
  assert.ok(result?.code, "Compiler did not produce JS output");
  return result.code;
}

const annotated = await compile("use memo");
const excluded = await compile("use no memo");
assert.match(annotated, /react\/compiler-runtime|useMemoCache|memo_cache_sentinel/, "Annotated component was not compiled");
assert.doesNotMatch(excluded, /react\/compiler-runtime|useMemoCache|memo_cache_sentinel/, "Explicitly excluded component was compiled");
console.log("React Compiler opt-in and opt-out transformation smoke passed");
