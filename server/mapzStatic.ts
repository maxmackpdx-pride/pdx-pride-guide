import type { RequestHandler } from 'express';
import fs from 'node:fs';
import path from 'node:path';

/** Only precompressed, content-addressed Mapz assets; never dynamic responses. */
export function mapzPrecompressed(distPath:string):RequestHandler {
 return (req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!/^\/assets\/mapz-[a-f0-9]{16}\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(js|css|glb)$/.test(req.path))return next();
  const file=path.join(distPath,req.path);
  res.vary('Accept-Encoding');
  const encoding=req.acceptsEncodings('br','gzip','identity');
  if(encoding===false){res.status(406).end();return;}
  if(encoding!=='br'&&encoding!=='gzip')return next();
  const compressed=file+(encoding==='br'?'.br':'.gz');
  if(!fs.existsSync(compressed))return next();
  res.type(path.extname(file)).set('Content-Encoding',encoding);
  res.sendFile(compressed,{immutable:true,maxAge:'1y'},error=>{if(error)next(error);});
 };
}

/** Build-generated static text only. Dynamic API and HTML responses bypass this. */
export function staticTextPrecompressed(distPath:string):RequestHandler {
 const root=path.resolve(distPath);
 return (req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)||!/^\/(?:assets|outzide-map|map-foundation|mapz-map|home-flight\/vendor)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-][a-zA-Z0-9_.-]*\.(js|css|json|svg)$/.test(req.path))return next();
  res.vary('Accept-Encoding');
  const encoding=req.acceptsEncodings('br','gzip','identity');
  if(encoding!=='br'&&encoding!=='gzip')return next();
  const file=path.join(root,req.path)+(encoding==='br'?'.br':'.gz');
  if(!fs.existsSync(file))return next();
  res.vary('Accept-Encoding').type(path.extname(req.path)).set('Content-Encoding',encoding);
  const immutable=req.path.startsWith('/assets/');
  // Explicit version queries reuse a preload across the host and its iframe.
  const maxAge=immutable?'1y':req.query.v?'4h':0;
  res.sendFile(file,{immutable,maxAge},error=>{if(error)next(error);});
 };
}
