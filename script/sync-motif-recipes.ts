import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { MOTIF_RECIPES_URL, parseMotifRecipes } from "../client/src/lib/designMotifRecipes";

const file = new URL("../client/src/lib/motifRecipes.snapshot.ts", import.meta.url);
const publicFile = new URL("../client/public/card-art/motif-recipes.json", import.meta.url);
const prefix = "// Checked snapshot of the published Foundation API. Refresh with npm exec tsx script/sync-motif-recipes.ts.\nexport default ";

export async function syncMotifRecipes() {
  try {
    const response = await fetch(MOTIF_RECIPES_URL, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Foundation motif API returned ${response.status}`);
    const recipes = parseMotifRecipes(await response.json());
    await writeFile(file, `${prefix}${JSON.stringify(recipes, null, 2)};\n`);
    await writeFile(publicFile, `${JSON.stringify(recipes, null, 2)}\n`);
    return recipes.release;
  } catch (error) {
    const saved = await readFile(file, "utf8");
    if (!saved.startsWith(prefix)) throw error;
    const recipes = parseMotifRecipes(JSON.parse(saved.slice(prefix.length).trim().replace(/;$/, "")));
    await writeFile(publicFile, `${JSON.stringify(recipes, null, 2)}\n`);
    console.warn("Foundation motif refresh unavailable; using checked snapshot", recipes.release);
    return recipes.release;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`Foundation motifs ${await syncMotifRecipes()}`);
}
