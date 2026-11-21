import path from "node:path";
import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

const source = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(source, "../..");
const out = path.join(repo, ".local/card-site/demo");
const assets = path.join(repo, "client/public");
const captures = path.join(repo, "reports/card-system-captures");

await build({
  root: source,
  base: "/demo/",
  configFile: false,
  publicDir: false,
  resolve: {
    alias: {
      "@/components/AuthModal": path.join(source, "DemoAuthModal.tsx"),
      "@": path.join(repo, "client/src"),
      "@shared": path.join(repo, "shared"),
      "@assets": path.join(repo, "attached_assets"),
    },
  },
  plugins: [
    {
      name: "demo-venue-location",
      enforce: "pre",
      transform(code, id) {
        if (!/(AfterzPrivateLocation|NightRideTools)\.tsx$/.test(id)) return null;
        const adapter = JSON.stringify(path.join(source, "demo-location.ts"));
        return "import { demoGeolocation } from " + adapter + ";\n" +
          code.replaceAll("navigator.geolocation", "demoGeolocation");
      },
    },
    react(),
    tailwindcss(),
    babel({
      presets: [reactCompilerPreset({ compilationMode: "infer", target: "19" })],
      include: /\/(?:client\/src|demos\/card-system-preview)\/.*\.[jt]sx?$/,
      exclude: /\/node_modules\/|\.(?:spec|test)\.[jt]sx?$/,
    }),
    {
      // Product room registries own the marks. Only the private Site prefix
      // changes when packaging those same assets into this standalone build.
      name: "site-room-asset-paths",
      enforce: "pre",
      transform(code, id) {
        if (!id.startsWith(path.join(repo, "client/src/")) || !/\.(?:css|tsx?)$/.test(id)) return null;
        return code.replaceAll("/brand/family/afterz.svg", "/demo/media/afterz.svg")
          .replaceAll("/brand/family/eventz.png", "/demo/media/eventz.png");
      },
    },
  ],
  build: { outDir: out, emptyOutDir: true, sourcemap: false },
});
const media = path.join(out, "media");
await mkdir(media, { recursive: true });
const files = [
  [source, "media/poster.jpg", "poster.jpg"],
  [assets, "brand/family/afterz.svg", "afterz.svg"],
  [assets, "brand/family/eventz.png", "eventz.png"],
  [assets, "fonts/home-discover/barlow-latin-400-normal.woff2", "barlow.woff2"],
  [assets, "fonts/outzide/barlow-latin-700-normal.woff2", "barlow-bold.woff2"],
  [assets, "fonts/outzide/barlow-condensed-latin-700-normal.woff2", "barlow-condensed.woff2"],
  [assets, "mapz-map/fonts/barlow-condensed-900.woff2", "barlow-condensed-black.woff2"],
  [assets, "fonts/home-discover/jetbrains-mono-latin-400-normal.woff2", "jetbrains-mono.woff2"],
  [captures, "event-info.png", "card.png"], [captures, "event-tickets.png", "tickets.png"],
  [captures, "events-placez.png", "placez.png"], [captures, "outzide.png", "outzide.png"],
  [captures, "afterz.png", "afterz.png"], [captures, "mizzed.png", "mizzed.png"],
];
await Promise.all(files.map(([root, name, destination]) => copyFile(path.join(root, name), path.join(media, destination))));
console.log(out);
