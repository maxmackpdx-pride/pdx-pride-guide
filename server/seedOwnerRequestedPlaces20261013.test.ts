import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { seedOwnerRequestedPlaces20261013 } from "./seedOwnerRequestedPlaces20261013";
function fixture() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE businesses (
    id INTEGER PRIMARY KEY, name TEXT, type TEXT, description TEXT, address TEXT, neighborhood TEXT,
    website TEXT, phone TEXT, hours TEXT, image_url TEXT, locations TEXT, queer_owned INTEGER,
    queer_friendly INTEGER, active INTEGER, ingest_events INTEGER, status TEXT, is_new INTEGER, created_at TEXT
  )`);
  return db;
}
test("creates two complete place records once and retains multiple Black Hole locations", () => {
  const db=fixture();
  assert.equal(seedOwnerRequestedPlaces20261013(db).length,2);
  assert.deepEqual(seedOwnerRequestedPlaces20261013(db),[]);
  const rows=db.prepare("SELECT * FROM businesses").all() as any[];
  assert.equal(rows.length,2);
  assert.equal(JSON.parse(rows.find(r=>r.name.startsWith("Black Hole")).locations).length,2);
  const cockeye=rows.find(r=>r.name==="Cockeye Kink");
  assert.equal(cockeye.address,null);
  assert.deepEqual(JSON.parse(cockeye.locations),[]);
  assert.ok(rows.every(r=>r.ingest_events===0 && r.queer_owned===0 && r.queer_friendly===0));
  db.close();
});
test("preserves existing records matched by alternate name or website", () => {
  const db=fixture();
  db.prepare("INSERT INTO businesses (name,description,website) VALUES (?,?,?)").run("Black Hole","Owner-written details",null);
  db.prepare("INSERT INTO businesses (name,description,website) VALUES (?,?,?)").run("An existing Cockeye record","Owner contact details","http://www.cockeyekink.com");
  assert.deepEqual(seedOwnerRequestedPlaces20261013(db),[]);
  assert.deepEqual(db.prepare("SELECT description FROM businesses ORDER BY id").all(),[{description:"Owner-written details"},{description:"Owner contact details"}]);
  db.close();
});
test("rolls back all insertions if a database constraint rejects a record", () => {
  const db=fixture();
  db.exec("CREATE TRIGGER reject_cockeye BEFORE INSERT ON businesses WHEN NEW.name = 'Cockeye Kink' BEGIN SELECT RAISE(ABORT, 'fixture rejection'); END");
  assert.throws(()=>seedOwnerRequestedPlaces20261013(db),/fixture rejection/);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM businesses").get() as {n:number}).n,0);
  db.close();
});
