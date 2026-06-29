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
    res.type("html").send(injectSeoIntoHtml(baseIndexHtml, requestPath));
  };

  // Serve injected HTML for the homepage — express.static would bypass SEO injection.
  app.get("/", sendSeoIndex);
  app.get("/index.html", sendSeoIndex);

  app.use(express.static(distPath, { index: false }));

  // SPA fallback with server-injected event listings for crawlers and AI fetchers.
  app.use("/{*path}", sendSeoIndex);
}