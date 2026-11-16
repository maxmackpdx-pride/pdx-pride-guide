import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import Database from 'better-sqlite3';
const source=fs.readFileSync('server/storage.ts','utf8');
const sql=source.split('// BOWERY_CLOSURE_SQL_BEGIN')[1].split('// BOWERY_CLOSURE_SQL_END')[0].match(/sqlite\.exec\(`([\s\S]*?)`\)/)[1];
function check({id=53,name='Bowery Bagels',address='310 NW Broadway',status='OPEN',closed=null,active=1}={}){const db=new Database(':memory:');db.exec('CREATE TABLE businesses(id INTEGER,name TEXT,address TEXT,status TEXT,closed_at TEXT,active INTEGER,ingest_events INTEGER,description TEXT)');db.prepare('INSERT INTO businesses VALUES(?,?,?,?,?,?,?,?)').run(id,name,address,status,closed,active,1,'preserved');db.exec(sql);const row=db.prepare('SELECT * FROM businesses').get();db.exec(sql);assert.equal(db.prepare('SELECT count(*) n FROM businesses').get().n,1);assert.equal(row.description,'preserved');assert.equal(row.address,address);db.close();return row;}
test('official Old Town closure preserves row and disables future ingest',()=>{const r=check();assert.equal(r.status,'CLOSED');assert.equal(r.closed_at,'2026-11-11');assert.equal(r.active,0);assert.equal(r.ingest_events,0);});
test('never changes PSU, different identity or different ID',()=>{for(const args of [{address:'1825 SW Broadway'},{name:'Other Business'},{id:54}])assert.equal(check(args).status,'OPEN');});
test('preserves later closure and noncanonical state',()=>{assert.equal(check({status:'CLOSED',closed:'2026-11-12',active:0}).closed_at,'2026-11-12');assert.equal(check({status:'TEMP_CLOSED',active:0}).status,'TEMP_CLOSED');});
