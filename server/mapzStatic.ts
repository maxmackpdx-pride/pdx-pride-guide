import type { RequestHandler } from 'express';
import fs from 'node:fs';
import path from 'node:path';

/** Only precompressed, content-addressed Mapz assets; never dynamic responses. */
export function mapzPrecompressed(distPath:string):RequestHandler {
 const root=path.resolve(distPath);
 return (req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!/^\/assets\/mapz-[a-f0-9]{16}\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(js|css|glb)$/.test(req.path))return next();
  const file=path.join(root,req.path);
  res.vary('Accept-Encoding');
  const encoding=req.acceptsEncodings('br','gzip','identity');
  if(encoding===false){res.status(406).end();return;}
  if(encoding!=='br'&&encoding!=='gzip')return next();
  const compressed=file+(encoding==='br'?'.br':'.gz');
  if(!fs.existsSync(compressed))return next();
  res.type(path.extname(file)).set('Content-Encoding',encoding);
  res.sendFile(path.relative(root,compressed),{root,immutable:true,maxAge:'1y'},error=>{if(error)next(error);});
 };
}

/** Build-generated static text only. Dynamic API and HTML responses bypass this. */
export function staticTextPrecompressed(distPath:string):RequestHandler {
 const root=path.resolve(distPath);
 return (req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!/^\/(?:assets|outzide-map|map-foundation|mapz-map|home-flight\/vendor)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(js|css|json|svg)$/.test(req.path))return next();
  res.vary('Accept-Encoding');
  const encoding=req.acceptsEncodings('br','gzip','identity');
  if(encoding===false){res.status(406).end();return;}
  if(encoding!=='br'&&encoding!=='gzip')return next();
  const file=path.join(root,req.path)+(encoding==='br'?'.br':'.gz');
  if(!fs.existsSync(file))return next();
  res.vary('Accept-Encoding').type(path.extname(req.path)).set('Content-Encoding',encoding);
  const immutable=req.path.startsWith('/assets/');
  // Explicit version queries reuse a preload across the host and its iframe.
  const maxAge=immutable?'1y':req.query.v?'4h':0;
  res.sendFile(path.relative(root,file),{root,immutable,maxAge},error=>{if(error)next(error);});
 };
}

const MUTABLE_STATIC=/^\/(?:outzide-map|map-foundation|mapz-map)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(?:js|css|json|svg|png|jpe?g|webp|avif)$/i;
const STATIC_FILE=/\.(?:js|mjs|css|json|map|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|glb|txt|xml)$/i;

/**
 * Card art, card CSS and the map apps live at stable, non-fingerprinted URLs and are edited without renaming.
 * Cloudflare caches .js/.css/images at the edge and rewrites their max-age up to 4h (Browser Cache TTL), so a card
 * change could keep rendering the previous build for hours. `no-cache` (ETag revalidation, a 304 when unchanged) is the
 * one directive Cloudflare passes through untouched (same as index.html and sw.js). Fingerprinted /assets stay immutable.
 */
export function mutableStaticRevalidate():RequestHandler {
 return (req,res,next)=>{
  if(['GET','HEAD'].includes(req.method)&&MUTABLE_STATIC.test(req.path))res.set('Cache-Control','no-cache');
  next();
 };
}

/** A missing file that looks like a static asset is a real, uncacheable 404, never the SPA shell (and never poisoned at the edge). */
export function missingStaticNotFound():RequestHandler {
 return (req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!STATIC_FILE.test(req.path))return next();
  res.status(404).set({'Cache-Control':'no-store, max-age=0','CDN-Cache-Control':'no-store','Cloudflare-CDN-Cache-Control':'no-store'}).type('text/plain').send('Not Found');
 };
}
