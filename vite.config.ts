import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import fs from "node:fs";
import { createHash } from "node:crypto";

// Fingerprint the complete standalone map, including its relative imports and artwork.
const flightSource = path.resolve(import.meta.dirname, "client/public/home-flight");
const flightHash = createHash("sha256");
function hashFlight(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) hashFlight(file);
    else flightHash.update(path.relative(flightSource, file)).update("\0").update(fs.readFileSync(file)).update("\0");
  }
}
hashFlight(flightSource);
const flightBase = `/assets/zaydar-${flightHash.digest("hex").slice(0, 16)}`;

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "version-zaydar-assets",
      apply: "build",
      closeBundle() {
        const output = path.resolve(import.meta.dirname, "dist/public");
        fs.cpSync(flightSource, path.join(output, flightBase), { recursive: true });
        fs.writeFileSync(path.join(output, "zaydar-manifest.json"), JSON.stringify({ base: flightBase }));
      },
    },
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: [
          // Icons + manifest only. Precaching hashed JS/CSS made SW updates
          // take seconds, then skipWaiting stole the open tab.
          "manifest.webmanifest",
          "favicon.png",
          "icons/*.png",
        ],
        // Main bundle can exceed the 2 MiB Workbox default after home/directory growth.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        rollupFormat: "iife",
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  // Absolute base: with "./" the bundle script resolved relative to nested
  // SPA routes (/events/13/slug -> /events/13/assets/*.js), got the HTML
  // fallback, and the app never booted on deep links.
  base: "/",
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // No manualChunks: hand-splitting leaflet created a circular chunk
    // dependency that crashed Safari with a TDZ error ("Cannot access 'Q'
    // before initialization") when the leaflet chunk evaluated first.
    // Vite's automatic chunking keeps evaluation order correct.
  },
  // Shared modules may reference process.env on the server; avoid browser TDZ.
  define: {
    __ZAYDAR_BASE__: JSON.stringify(command === "build" ? flightBase : "/home-flight"),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Middleware mode is configured in server/vite.ts (hmr on same HTTP port).
  },
}));
