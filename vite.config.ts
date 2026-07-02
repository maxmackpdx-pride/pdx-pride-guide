import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  base: "./",
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
