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
