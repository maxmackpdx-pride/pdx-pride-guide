import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {getWinterConditions} from '../../server/outzWinter';
import {publicWinterEvents} from '../../shared/outzWinterEvents';
const root=fileURLToPath(new URL('../../client/public/outzide-map/',import.meta.url));
let eventsCache:{at:number;events:any[]}|null=null;
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url||'/','http://localhost');
 if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return}
 if(url.pathname.startsWith('/api/outz/winter/')){
  let data:any;
  if(url.pathname==='/api/outz/winter/events'){
   if(!eventsCache||Date.now()-eventsCache.at>300000){const r=await fetch('https://www.zaylist.com/api/events',{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error();const rows=await r.json();eventsCache={at:Date.now(),events:publicWinterEvents(Array.isArray(rows)?rows:rows.events||[])}}
   data={events:eventsCache.events,fetchedAt:new Date().toISOString()};
  }else data=await getWinterConditions(decodeURIComponent(url.pathname.split('/').pop()||''));
  res.writeHead(data?200:404,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data||{error:'Unknown resort'}));return;
 }
 if(url.pathname.startsWith('/api/')){res.writeHead(404,{'Content-Type':'application/json'}).end('{"error":"API unavailable in static preview"}');return}
 const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403).end();return}
 const bytes=await readFile(path);const mime:Record<string,string>={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
 res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(502,{'Content-Type':'application/json'}).end('{"error":"Source unavailable"}')}});
server.listen(Number(process.env.PORT||4390),'127.0.0.1',()=>console.log('Outzide winter preview listening'));
