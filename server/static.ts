import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { injectSeoIntoHtml } from "./seo";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const baseIndexHtml = fs.readFileSync(indexPath, "utf8");
  const sendSeoIndex = (req: express.Request, res: express.Response) => {
    const requestPath = (req.originalUrl || req.url || req.path || "/").split("?")[0] || "/";
    res.set("Cache-Control", "no-cache").type("html").send(injectSeoIntoHtml(baseIndexHtml, requestPath));
  };

  // Serve injected HTML for the homepage — express.static would bypass SEO injection.
  app.get("/", sendSeoIndex);
  app.get("/index.html", sendSeoIndex);

  // Hashed build assets are content-addressed — cache forever. A hash miss
  // (stale page after a deploy) must 404, not fall through to the SPA HTML,
  // so the client can detect it and reload.
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    index: false,
    immutable: true,
    maxAge: "1y",
    fallthrough: false,
  }));

  app.use(express.static(distPath, { index: false }));

  // SPA fallback with server-injected event listings for crawlers and AI fetchers.
  app.use("/{*path}", sendSeoIndex);
}