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
          "index.html",
          "manifest.webmanifest",
          "favicon.png",
          "icons/*.png",
          "assets/*.{js,css,woff2}",
        ],
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
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
