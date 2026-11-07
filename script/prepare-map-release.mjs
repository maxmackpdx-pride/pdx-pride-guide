import {readFileSync,existsSync,mkdirSync,rmSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
export function validateMapRelease(lock){
 if(lock.repository!=='maxmackpdx-pride/zaylist-maps'||lock.tag!=='v1.0.0'||!/^\/[a-z0-9/.-]+\/$/.test(lock.base)||lock.base!==`/map-assets/${lock.tag}/`||!/^[a-f0-9]{40}$/.test(lock.commit)||!/^[a-f0-9]{64}$/.test(lock.sha256))throw Error('Map release lock must name the exact tagged source commit and archive SHA-256');
 for(const [name,value] of Object.entries({'react':'19.3.1','maplibre-gl':'6.16.0','@vis.gl/react-maplibre':'8.1.3','vite':'8.3.5'}))if(lock.stack?.[name]!==value)throw Error(`Map release stack mismatch: ${name}`);
 if(!validEntry(lock.entry)||!lock.entry.endsWith('.js')||!Array.isArray(lock.styles)||!lock.styles.length||lock.styles.some(name=>!validEntry(name)||!name.endsWith('.css')))throw Error('Invalid map entry or styles');
 if(lock.archive!==`vendor/zaylist-maps/${lock.tag}.tar.gz`)throw Error('Invalid map release archive path');
 if(lock.archiveParts&&(!Array.isArray(lock.archiveParts)||!lock.archiveParts.length||lock.archiveParts.some((name,index)=>name!==`${lock.archive}.part${String(index).padStart(3,'0')}`)))throw Error('Invalid or unordered map archive parts');
 return lock;
}
function validEntry(name){return typeof name==='string'&&/^[a-zA-Z0-9_./-]+$/.test(name)&&!name.startsWith('/')&&!name.split('/').includes('..');}
export function prepareMapRelease(output=join(root,'dist/public')){
 const lock=validateMapRelease(JSON.parse(readFileSync(join(root,'shared/mapReleaseLock.json'),'utf8')));
 const archive=lock.archiveParts?join(root,'.local','map-release-v1.0.0.tar.gz'):join(root,lock.archive);
 if(lock.archiveParts){mkdirSync(join(root,'.local'),{recursive:true});writeFileSync(archive,Buffer.concat(lock.archiveParts.map(file=>readFileSync(join(root,file)))));}
 const hash=createHash('sha256').update(readFileSync(archive)).digest('hex');
 if(hash!==lock.sha256)throw Error('Pinned map release archive checksum does not match lock');
 const names=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n');
 if(names.some(name=>!['.','./'].includes(name)&&!validEntry(name.replace(/^\.\//,''))))throw Error('Unsafe path in map release archive');
 const types=execFileSync('tar',['-tvzf',archive],{encoding:'utf8'}).trim().split('\n');
 if(types.some(row=>!['-','d'].includes(row[0])))throw Error('Links/special files are not permitted in map release archive');
 const destination=join(output,lock.base);
 rmSync(destination,{recursive:true,force:true});mkdirSync(destination,{recursive:true});
 execFileSync('tar',['-xzf',archive,'-C',destination,'--no-same-owner','--no-same-permissions']);
 for(const file of [lock.entry,...lock.styles,'maplibre-worker-6.16.0.cjs'])if(!existsSync(join(destination,file)))throw Error(`Pinned map release is missing ${file}`);
 if(/\bprocess\.env\.NODE_ENV\b/.test(readFileSync(join(destination,lock.entry),'utf8')))throw Error('Browser map artifact still contains an unresolved Node environment global');
 writeFileSync(join(destination,'release-lock.json'),JSON.stringify(lock));
 copyFileSync(join(root,'shared/mapReleaseLock.json'),join(output,'map-release.json'));
 console.log(`Pinned map ${lock.tag} (${lock.commit}): ${hash}`);
 return lock;
}
if(process.argv[1]&&resolve(process.argv[1])===import.meta.filename)prepareMapRelease(process.argv[2]?resolve(process.argv[2]):undefined);
