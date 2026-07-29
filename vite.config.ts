import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      manifest: false,
      injectManifest: {
        globPatterns: [
          // index.html is served network-first only — precaching it strands PWA users on stale bundles.
          "manifest.webmanifest",
          "favicon.png",
          "icons/*.png",
          "assets/*.{js,css,woff2}",
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
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Middleware mode is configured in server/vite.ts (hmr on same HTTP port).
  },
});
