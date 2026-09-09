import express from 'express';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { injectSeoIntoHtml } from "./seo";

const APP_PATHS = new Set([
  "/", "/index.html", "/z", "/events", "/map", "/schedule", "/submit", "/pride-work", "/gifting", "/sellz",
  "/the-hauz", "/the-hauz/new", "/about", "/aboutz", "/resume", "/contact", "/sponsors", "/access", "/legal",
  "/admin", "/dashboard", "/settings/notifications", "/reset-password", "/inbox", "/spotted", "/directory", "/outz", "/design-preview", "/next", "/darkroom",
]);
function isAppPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return APP_PATHS.has(normalized) || /^\/(?:events|directory)\/[^/]+(?:\/[^/]+)?$/.test(normalized)
    || /^\/(?:z|u|outz|the-hauz)\/[^/]+$/.test(normalized) || /^\/submit\/claim\/[^/]+$/.test(normalized);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const flightManifest = path.join(distPath, "zaydar-manifest.json");
  const flightBase = fs.existsSync(flightManifest) ? JSON.parse(fs.readFileSync(flightManifest, "utf8")).base as string : null;
  const sendSeoIndex = (req: express.Request, res: express.Response) => {
    const requestPath = (req.originalUrl || req.url || req.path || "/").split("?")[0] || "/";
    if ((requestPath === "/" || requestPath === "/index.html") && flightBase) {
      // Also available to Cloudflare Early Hints when enabled for the zone.
      res.set("Link", [
        `<${flightBase}/poster.webp>; rel=preload; as=image`,
        `<${flightBase}/vendor/maplibre-gl-5.6.2.js>; rel=preload; as=script`,
        '<https://tiles.openfreemap.org>; rel=preconnect; crossorigin',
      ].join(", "));
    }
    // Read from disk each request so a deploy never serves a stale bundle hash
    // from an in-memory snapshot taken at process startup.
    let baseIndexHtml = fs.readFileSync(indexPath, "utf8");
    if (process.env.LOCAL_PREVIEW === "1") {
      baseIndexHtml = baseIndexHtml.replace(
        "<head>",
        '<head><script>window.__PDX_LOCAL_PREVIEW__=1</script>',
      );
    }
    res.status(isAppPath(requestPath) ? 200 : 404).set("Cache-Control", "no-cache").type("html").send(injectSeoIntoHtml(baseIndexHtml, requestPath));
  };

  // Short vanity URLs → their canonical page. 302 (not 301) so the target can
  // change later without browsers hard-caching the redirect. Express routing is
  // case-insensitive, so /YCT, /yct, /Yct all match.
  const VANITY_REDIRECTS: Record<string, string> = {
    "/YCT": "/easter-eggs/stank-secret-story.html",
  };
  for (const [from, to] of Object.entries(VANITY_REDIRECTS)) {
    app.get(from, (_req, res) => res.redirect(302, to));
  }

  // Serve injected HTML for the homepage - express.static would bypass SEO injection.
  app.get("/", sendSeoIndex);
  app.get("/index.html", sendSeoIndex);

  // Hashed build assets are content-addressed - cache forever. A hash miss
  // (stale page after a deploy) must 404, not fall through to the SPA HTML,
  // so the client can detect it and reload.
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    index: false,
    immutable: true,
    maxAge: "1y",
    fallthrough: false,
  }));

  app.use(express.static(distPath, {
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith(`${path.sep}sw.js`)) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));

  // Browsers request /favicon.ico by default; do not serve SPA HTML for it.
  app.get("/favicon.ico", (_req, res) => {
    res.redirect(302, "/favicon.png");
  });

  // SPA fallback with server-injected event listings for crawlers and AI fetchers.
  app.use("/{*path}", sendSeoIndex);
}
