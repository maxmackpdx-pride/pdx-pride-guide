import express from 'express';
import { mapzPrecompressed,staticTextPrecompressed } from './mapzStatic';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { injectSeoIntoHtml } from "./seo";
import { homeBootLogoHtml } from "../shared/homeBoot";

const APP_PATHS = new Set([
  "/", "/map-demo", "/index.html", "/z", "/events", "/map", "/boards", "/schedule", "/submit", "/gigz", "/giftz", "/sellz",
  "/gigz/new", "/giftz/new", "/sellz/new", "/mizzed/new",
  "/the-hauz", "/the-hauz/new", "/about", "/aboutz", "/resources", "/rezources", "/resume", "/contact", "/sponsors", "/access", "/legal",
  "/admin", "/dashboard", "/settings/notifications", "/reset-password", "/inbox", "/mizzed", "/directory", "/outzide", "/design-preview", "/design-system/specimen", "/next", "/darkroom",
]);
function isAppPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return /^\/outzide\/share\/[^/]+$/.test(normalized) || APP_PATHS.has(normalized) || /^\/(?:events|directory)\/[^/]+(?:\/[^/]+)?$/.test(normalized)
    || /^\/(?:z|u|outzide|the-hauz)\/[^/]+$/.test(normalized) || /^\/submit\/claim\/[^/]+$/.test(normalized);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const sendSeoIndex = (req: express.Request, res: express.Response) => {
    const requestPath = (req.originalUrl || req.url || req.path || "/").split("?")[0] || "/";
    if (requestPath === "/" || requestPath === "/index.html") {
      res.set("Link", '</brand/family/zaylist-primary.svg>; rel=preload; as=image; fetchpriority=high');
    }
    // Read from disk each request so a deploy never serves a stale bundle hash
    // from an in-memory snapshot taken at process startup.
    let baseIndexHtml = fs.readFileSync(indexPath, "utf8");
    if (requestPath === "/" || requestPath === "/index.html") {
      baseIndexHtml = baseIndexHtml.replace('<div id="root"></div>', `<div id="root">${homeBootLogoHtml}</div>`);
    }
    const mapEntry=requestPath === "/map" || requestPath === "/map-demo" ? "src/pages/MapzMapDemo.tsx" : requestPath === "/outzide" ? "src/pages/Outz.tsx" : null;
    if(mapEntry){
      const manifest=JSON.parse(fs.readFileSync(path.join(distPath,".vite/manifest.json"),"utf8"));
      const entry=manifest[mapEntry];
      if(entry){
        const css=new Set<string>();
        const visited=new Set<string>();
        const collect=(key:string)=>{if(visited.has(key))return;visited.add(key);const chunk=manifest[key];for(const file of chunk?.css||[])css.add(file);for(const imported of chunk?.imports||[])collect(imported);};
        collect(mapEntry);
        baseIndexHtml=baseIndexHtml.replace('</head>',`<link rel="modulepreload" href="/${entry.file}">${[...css].map(file=>`<link rel="preload" as="style" href="/${file}">`).join('')}</head>`);
      }
    }
    if(requestPath === "/map" || requestPath === "/map-demo") {
      const {assets}=JSON.parse(fs.readFileSync(path.join(distPath,"mapz-manifest.json"),"utf8"));
      baseIndexHtml=baseIndexHtml.replace('</head>',`<link rel="preload" as="script" href="${assets.maplibre}"><link rel="modulepreload" href="${assets.script}"><link rel="preload" as="script" href="${assets.perf}"><link rel="preload" as="style" href="/outzide-map/assets/map-continuity.css?v=2"><link rel="preload" as="style" href="${assets.maplibreCss}"><link rel="preload" as="style" href="${assets.style}"></head>`);
    } else if(requestPath === "/outzide") {
      const {assets}=JSON.parse(fs.readFileSync(path.join(distPath,"outzide-manifest.json"),"utf8"));
      baseIndexHtml=baseIndexHtml.replace('</head>',`<link rel="preload" as="script" href="${assets.maplibre}"><link rel="modulepreload" href="${assets.script}"></head>`);
    }
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
  app.use(mapzPrecompressed(distPath));
  app.use(staticTextPrecompressed(distPath));
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    index: false,
    immutable: true,
    maxAge: "1y",
    fallthrough: false,
  }));

  app.use(express.static(distPath, {
    index: false,
    redirect: false,
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
