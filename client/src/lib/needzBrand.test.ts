import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resourceMapHref} from './resourceMap';
import {mapBrowseHref} from './mapBrowseHref';
import {PRIMARY_NAV} from './siteNav';

test('NEEDZ is the canonical navigation and selected-resource deep link',()=>{
 const link=PRIMARY_NAV.find(item=>item.type==='link'&&item.label==='NEEDZ');
 assert.equal(link?.type==='link'&&link.href,'/needz');
 const target=new URL(resourceMapHref('Care & community'), 'https://www.zaylist.com');
 assert.equal(target.pathname,'/needz');assert.equal(target.searchParams.get('resource'),'Care & community');
});
test('NEEDZ retains resource-only Mapz doorway filters and existing internal keys',()=>{
 const params=new URL(mapBrowseHref('rezources'),'https://www.zaylist.com').searchParams;
 assert.equal(params.get('layer'),'rezources');assert.equal(params.get('hideResources'),'0');
 for(const key of ['hideEvents','hidePlaces','hideGigz','hideGiftz','hideSellz','hideMizzed','hideHouz'])assert.equal(params.get(key),'1');
});
test('legacy URLs redirect without discarding deep-link queries and active art is editable SVG',()=>{
 const server=readFileSync('server/index.ts','utf8');
 for(const path of ['/resources','/rezources','/z/resources','/z/rezources'])assert.ok(server.includes(`"${path}": "/needz"`));
 assert.match(server,/if \(exact\) return res.redirect\(301, exact \+ qs\)/);
 const app=readFileSync('client/src/App.tsx','utf8');
 assert.match(app,/<Route path="\/needz" component=\{Resources\}/);
 assert.match(app,/\/needz\$\{window.location.search\}\$\{window.location.hash\}/);
 const svg=readFileSync('client/public/brand/family/needz.svg','utf8');
 assert.match(svg,/<title id="title">NEEDZ<\/title>/);assert.match(svg,/<path/);assert.doesNotMatch(svg,/<image/);
 assert.equal(existsSync('client/src/components/resources/RezourcesLogo.tsx'),false);
});

test('existing resource Hub updates display NEEDZ without changing subscription identity or stored history',async()=>{
 const {default:Database}=await import('better-sqlite3');
 const {resourceReleaseItems}=await import('../../../server/hubSectionActivity');
 const db=new Database(':memory:');
 try{
  db.exec("CREATE TABLE hub_section_activity(id TEXT,title TEXT,body TEXT,created_at TEXT,section TEXT)");
  db.prepare('INSERT INTO hub_section_activity VALUES(?,?,?,?,?)').run('release-old','ReZources directory updated','Follow ReZources to keep updates here','2026-10-01','rezources');
  const [item]=resourceReleaseItems(db);
  assert.equal(item.title,'NEEDZ directory updated');assert.equal(item.text,'Follow NEEDZ to keep updates here');assert.equal(item.source?.id,'rezources');assert.equal(item.link,'/needz');
  assert.equal((db.prepare('SELECT title FROM hub_section_activity').get() as {title:string}).title,'ReZources directory updated');
 }finally{db.close();}
});
