import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import path from "node:path";
import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { writeDesignComponentSourceEvidence } from "./design-component-source-evidence";
import { writeOutzideTokens } from "./build-outzide-tokens.mjs";
import { assertNav } from "./nav-tripwire";
import { assertTokens } from "./token-guard.mjs";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  execFileSync(process.execPath, ["--test", "script/mapz-startup.test.mjs", "script/mapz-tiles.test.mjs"], { stdio: "inherit" });
  await rm("dist", { recursive: true, force: true });
  const evidence = await writeDesignComponentSourceEvidence();
  console.log(`sealed ${evidence.sources.length} canonical design source checksums`);

  console.log(`outzide tokens ${await writeOutzideTokens()}`);
  console.log(`nav tripwire ok (${assertNav()} destinations)`);
  console.log(`token guard ok (${assertTokens()} raw hexes, none new)`);

  console.log("building client...");
  await viteBuild();

  // Startup text is served directly by Express, so emit both negotiated encodings.
  const compress = async (directory:string):Promise<void> => {
    for(const entry of await readdir(directory,{withFileTypes:true})) {
      const file=path.join(directory,entry.name);
      if(entry.isDirectory()){await compress(file);continue;}
      if(!/\.(js|css|json|svg)$/.test(file))continue;
      const bytes=await readFile(file);
      await writeFile(file+'.br',brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}));
      await writeFile(file+'.gz',gzipSync(bytes));
    }
  };
  for(const directory of ['assets','outzide-map','map-foundation','mapz-map','home-flight/vendor'])await compress(path.join('dist/public',directory));
  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
