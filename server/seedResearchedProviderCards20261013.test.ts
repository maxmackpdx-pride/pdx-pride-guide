import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';
import { seedResearchedProviderCards20261013, RESEARCHED_PROVIDER_CARDS_20261013 } from './seedResearchedProviderCards20261013';
function fixture() {
  const db=new Database(':memory:');
  db.exec(`CREATE TABLE businesses(id INTEGER PRIMARY KEY,name TEXT,type TEXT,description TEXT,address TEXT,neighborhood TEXT,website TEXT,phone TEXT,hours TEXT,image_url TEXT,locations TEXT,queer_owned INTEGER,queer_friendly INTEGER,active INTEGER,ingest_events INTEGER,status TEXT,is_new INTEGER,created_at TEXT,lat REAL,lng REAL)`);
  return db;
}
test('all reviewed candidates insert once, including separate agents at one brokerage',()=>{
 const db=fixture();assert.equal(seedResearchedProviderCards20261013(db).length,36);
 assert.deepEqual(seedResearchedProviderCards20261013(db),[]);
 const agents=db.prepare("SELECT name,website FROM businesses WHERE name LIKE '%Living Room Realty%'").all();assert.equal(agents.length,2);
 assert.notEqual((agents[0] as any).website,(agents[1] as any).website);
 assert.ok((db.prepare('SELECT ingest_events,active FROM businesses').all() as any[]).every(r=>r.ingest_events===0&&r.active===1));db.close();
});
test('existing owner records and source-name aliases are preserved',()=>{
 const db=fixture();db.prepare('INSERT INTO businesses(name,description,website,lat,lng) VALUES(?,?,?,?,?)').run('Enjoy Company Hair Studio','Owner copy','https://example.test',45.5,-122.6);
 seedResearchedProviderCards20261013(db);
 assert.deepEqual(db.prepare("SELECT description,lat,lng FROM businesses WHERE name='Enjoy Company Hair Studio'").get(),{description:'Owner copy',lat:45.5,lng:-122.6});
 assert.equal((db.prepare("SELECT COUNT(*) n FROM businesses WHERE name='Enjoy Co. Hair Studio'").get() as any).n,0);db.close();
});
test('remote and mobile providers have no invented map locations; membership is not ownership',()=>{
 const db=fixture();seedResearchedProviderCards20261013(db);
 for(const name of ['trans bodycare','NerdyKeppie','SomaSoul Healing','Rainbow Forge','Gay Thrive','Max Burns UX','Clau Studio','Smonday Studios','Studio Anansi']){
  const r=db.prepare('SELECT address,locations,lat,lng FROM businesses WHERE name=?').get(name) as any;
  assert.equal(r.address,null,name);assert.deepEqual(JSON.parse(r.locations),[],name);assert.equal(r.lat,null);assert.equal(r.lng,null);
 }
 for(const name of ['Plush Tattoo & Intuitive Arts','Birdhouse Tattoo · Noble','Jenson Sarr — Living Room Realty']) assert.equal((db.prepare('SELECT queer_owned FROM businesses WHERE name=?').get(name) as any).queer_owned,0,name);
 assert.equal((db.prepare("SELECT queer_owned FROM businesses WHERE name='Fruit'").get() as any).queer_owned,1);
 assert.ok(RESEARCHED_PROVIDER_CARDS_20261013.every(r=>r.sourceUrls.length>0&&r.bookingUrl));db.close();
});
test('a rejected insertion rolls back the complete seed',()=>{
 const db=fixture();db.exec("CREATE TRIGGER reject_fruit BEFORE INSERT ON businesses WHEN NEW.name='Fruit' BEGIN SELECT RAISE(ABORT,'rejected fixture'); END");assert.throws(()=>seedResearchedProviderCards20261013(db),/rejected fixture/);assert.equal((db.prepare('SELECT COUNT(*) n FROM businesses').get() as any).n,0);db.close();
});
