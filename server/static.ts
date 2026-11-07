import mapRelease from "../shared/mapReleaseLock.json";
import express from 'express';
import { mapzPrecompressed,staticTextPrecompressed,mutableStaticRevalidate,missingStaticNotFound } from './mapzStatic';
import type { Express } from 'express';
import fs from "node:fs";
import path from "node:path";
import { injectSeoIntoHtml } from "./seo";
import { homeBootLogoHtml } from "../shared/homeBoot";

const APP_PATHS = new Set([
  "/", "/map-demo", "/index.html", "/z", "/events", "/map", "/boardz", "/boards", "/all-boards", "/our-boardz", "/all-boards", "/schedule", "/submit", "/gigz", "/giftz", "/sellz",
  "/gigz/new", "/giftz/new", "/sellz/new", "/mizzed/new",
  "/my-houz", "/my-houz/new", "/houz", "/the-hauz", "/the-hauz/new", "/about", "/aboutz", "/resources", "/rezources", "/needz", "/resume", "/contact", "/sponsors", "/access", "/legal",
  "/admin", "/dashboard", "/settings/notifications", "/reset-password", "/inbox", "/mizzed", "/directory", "/outzide", "/design-preview", "/design-system/specimen", "/next", "/darkroom",
]);
function isAppPath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  return /^\/outzide\/share\/[^/]+$/.test(normalized) || APP_PATHS.has(normalized) || /^\/(?:events|directory)\/[^/]+(?:\/[^/]+)?$/.test(normalized)
    || /^\/(?:z|u|outzide|my-houz|the-hauz)\/[^/]+$/.test(normalized) || /^\/submit\/claim\/[^/]+$/.test(normalized);
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
    const mapEntry=["/map","/map-demo","/outzide"].includes(requestPath)||requestPath.startsWith("/outzide/share/")?"src/pages/UnifiedMap.tsx":null;
    if(mapEntry){
      // The homepage globe competes with the map engine on cold map routes.
      baseIndexHtml=baseIndexHtml.replace(/<link[^>]*href="\/home-globe\/portland-city-beam-density\.png"[^>]*>/g, "");
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
    if(mapEntry){
      baseIndexHtml=baseIndexHtml.replace('</head>',`<link rel="modulepreload" href="${mapRelease.base}${mapRelease.entry}">${mapRelease.styles.map(file=>`<link rel="preload" as="style" href="${mapRelease.base}${file}">`).join('')}</head>`);
    }
    if (process.env.LOCAL_PREVIEW === "1") {
      baseIndexHtml = baseIndexHtml.replace(
        "<head>",
        '<head><script>window.__PDX_LOCAL_PREVIEW__=1</script>',
      );
    }
    res.status(isAppPath(requestPath) ? 200 : 404).set(isAppPath(requestPath) ? { "Cache-Control": "no-cache" } : { "Cache-Control": "no-store", "CDN-Cache-Control": "no-store", "Cloudflare-CDN-Cache-Control": "no-store" }).type("html").send(injectSeoIntoHtml(baseIndexHtml, requestPath));
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

  // Retired standalone bookmarks now resolve to the one native map system.
  // Data, images, shared helpers and destination-detail URLs are not redirected.
  for(const prefix of ['/mapz-map','/outzide-map']){
    app.get([prefix,prefix+'/',prefix+'/index.html'],(req,res)=>{
      const query=new URL(req.originalUrl,'https://www.zaylist.com').searchParams;
      if(query.has('guestPlace')&&!query.has('place'))query.set('place',query.get('guestPlace')!);
      query.delete('guestPlace');
      const target=prefix==='/mapz-map'?'/map':'/outzide';
      if(prefix==='/mapz-map'&&!query.has('mode'))query.set('mode','mapz');
      res.redirect(308,target+(query.size?'?'+query.toString():''));
    });
  }

  // Serve injected HTML for the homepage - express.static would bypass SEO injection.
  app.get("/", sendSeoIndex);
  app.get("/index.html", sendSeoIndex);

  // Hashed build assets are content-addressed - cache forever. A hash miss
  // (stale page after a deploy) must 404, not fall through to the SPA HTML,
  // so the client can detect it and reload.
  app.use(mutableStaticRevalidate());
  app.use(mapzPrecompressed(distPath));
  app.use(staticTextPrecompressed(distPath));
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    index: false,
    immutable: true,
    maxAge: "1y",
    fallthrough: true,
  }));
  // A missing hashed asset is a real 404 and must never be cached. Cloudflare
  // otherwise caches the 404 at the edge and hands the browser a 4h max-age, so
  // one request that lands mid-deploy (new index.html, old container) poisons
  // that chunk URL and strands the route on its loading spinner.
  app.use("/assets", (_req, res) => {
    res.status(404)
      .set({
        "Cache-Control": "no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Cloudflare-CDN-Cache-Control": "no-store",
      })
      .type("text/plain")
      .send("Not Found");
  });

  // Live directory artwork is content data, not part of the frozen engine bundle.
  // v1.0.0 emits these legacy card paths; resolve only the exact known families.
  app.get(`${mapRelease.base}card-assets/directory-logos/:file`, (req,res,next)=>{
    if(!/^[a-zA-Z0-9_-]+\.(?:svg|png|webp)$/.test(req.params.file))return next();
    res.set('Cache-Control','no-cache').redirect(307,`/directory-logos/${req.params.file}`);
  });
  for(const family of ['giftz','sellz'])app.get(`${mapRelease.base}card-assets/boardz/punk/${family}.svg`,(_req,res)=>res.set('Cache-Control','no-cache').redirect(307,`/boardz/punk/${family}.svg`));
  for(const category of ['nonprofit','healthcare','realestate'])app.get(`${mapRelease.base}waypoints/package/placez-${category}.svg`,(_req,res)=>res.set('Cache-Control','no-cache').redirect(307,`/mapz-map/icons/types/${category}.svg`));

  // Only the checksum-verified pinned artifact is served at this immutable namespace.
  app.use(mapRelease.base,express.static(path.join(distPath,mapRelease.base),{index:false,immutable:true,maxAge:'1y',fallthrough:false,setHeaders(res,file){res.setHeader('X-Zaylist-Map-Release',mapRelease.tag);if(file.endsWith('.cjs'))res.setHeader('Content-Type','text/javascript; charset=utf-8');}}));

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

  // Unknown static-looking files (e.g. /map-foundation/new.js requested mid-deploy) must 404 uncached, not fall into the SPA shell.
  app.use(missingStaticNotFound());

  // SPA fallback with server-injected event listings for crawlers and AI fetchers.
  app.use("/{*path}", sendSeoIndex);
}
