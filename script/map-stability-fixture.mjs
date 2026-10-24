import express from 'express';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export async function startMapStabilityFixture({port=0,sourceMaps=false}={}){
const app=express();
app.get('/api/auth/me',(_req,res)=>res.status(401).json({error:'Guest fixture'}));
const places=JSON.parse(fs.readFileSync('client/public/outzide-map/places.json')).places;
const publicRows=(name,fallback)=>{const file='.local/map-stability/public-'+name+'.json';return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):fallback;};
app.get('/api/events',(_req,res)=>res.json(publicRows('events',[])));
app.get('/api/directory',(_req,res)=>res.json(publicRows('directory',[
 {id:1,name:'Fixture Place',category:'bars',address:'Portland',lat:45.523,lng:-122.675,isActive:true},
])));
app.get('/api/events/attendance-summaries',(_req,res)=>res.json({}));
app.get('/api/housing',(_req,res)=>res.json({listings:[]}));
app.use('/api',(_req,res)=>res.json([]));
if(sourceMaps)for(const dir of ['outzide-map','map-foundation','mapz-map'])app.use('/'+dir,express.static('client/public/'+dir));
app.use(express.static('dist/public'));
app.get('/{*path}',(_req,res)=>res.sendFile(process.cwd()+'/dist/public/index.html'));
const server=await new Promise((resolve,reject)=>{const s=app.listen(port,'127.0.0.1',()=>resolve(s));s.on('error',reject);});
return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const server=await startMapStabilityFixture({port:Number(process.env.PORT||5057),sourceMaps:process.env.SOURCE_MAPS==='1'});
 console.log('Map stability fixture on http://127.0.0.1:'+server.address().port);
}
