import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

if (process.env.ALLOW_QSEARCH_TEST_DB !== "1" || !process.env.DATABASE_PATH) {
  throw new Error("Run only with ALLOW_QSEARCH_TEST_DB=1 and a disposable DATABASE_PATH.");
}
// Do not open any database until the disposable-test guard has passed.
const { sqlite, storage } = await import("../server/storage");
const { createEventFromResearch, listEventResearchChanges, rollbackEventResearchChange } = await import("../server/eventResearchMemory");
const {
  beginResearchRun, finishResearchRun, ensureEventResearchControlTables, evaluateDecisionGate,
  getResearchControlState, recordConflict, enqueueResearchReview, resolveResearchItem,
  recordFieldEvidence, upsertMistakeTest, recordMistakeTestResult,
} = await import("../server/eventResearchControl");

ensureEventResearchControlTables();
// Reproduce an existing deployment's pre-candidate schema in this disposable DB.
const legacyConflictCount=(sqlite.prepare("SELECT count(*) AS n FROM agent_event_conflicts").get() as {n:number}).n;
sqlite.exec("DROP INDEX IF EXISTS agent_event_conflicts_candidate");
sqlite.exec("ALTER TABLE agent_event_conflicts DROP COLUMN candidate_key");
ensureEventResearchControlTables();
ensureEventResearchControlTables();
assert.equal((sqlite.prepare("SELECT count(*) AS n FROM agent_event_conflicts").get() as {n:number}).n,legacyConflictCount,"migration retains existing conflict records");
assert.ok((sqlite.prepare("PRAGMA table_info(agent_event_conflicts)").all() as Array<{name:string}>).some(x=>x.name==="candidate_key"));
const run = beginResearchRun({});
assert.equal(run.ok,true);
// These are disposable integration fixtures, not production semantic-test results.
for (const test of getResearchControlState().mistakeTests) recordMistakeTestResult({ testKey: test.test_key, passed: true });
const testKey = "candidate-gate-smoke";
assert.equal(upsertMistakeTest({ testKey, title:"Candidate gate fixture", misleadingInput:{}, evidence:{}, expected:{}, forbidden:{} }).ok,true);
const candidateKey = `candidate:smoke:${randomUUID()}`;
const checkedAt = new Date().toISOString();
const sources = ["https://example.com/official-candidate", "https://example.com/official-candidate-tickets"];
const event = {
  title: `Candidate gate ${randomUUID()}`,
  description: "Disposable official-source candidate used only for integration tests.",
  venueName: "Candidate Test Venue", address: "1 Test Ave, Portland, OR 97201",
  dateStart: "2027-11-15T19:00:00", dateEnd: "2027-11-15T21:00:00",
  ageRequirement: "21_PLUS", admission: "UNKNOWN", status: "LIVE", eventTypes: ["COMMUNITY"],
  posterImageUrl: null,
};
function seed(entityKey:string, values:Record<string,unknown>, urls=sources, options:Record<string,unknown>={}) {
  for(const [field,observedValue] of Object.entries(values))for(const sourceUrl of urls) {
    assert.equal(recordFieldEvidence({ runId:run.runId, entityKey, field, observedValue, sourceUrl, checkedAt, ...options }).ok,true);
  }
}
const gateInput = { candidateKey, runId:run.runId, fields:Object.keys(event), proposedValues:event, requireIndependentVerification:true };
function gate(input=gateInput) {
  const result=evaluateDecisionGate(input);assert.equal(result.ok,true);if(!result.ok)throw Error(result.error);return result;
}
assert.equal(evaluateDecisionGate({...gateInput,eventId:storage.getEvents({})[0]?.id||1}).ok,false,"cannot borrow an existing event ID");
assert.equal(evaluateDecisionGate({...gateInput,candidateKey:"Not Canonical"}).ok,false);
assert.equal(evaluateDecisionGate({...gateInput,runId:undefined}).ok,false,"candidate requires active run");
assert.equal(gate().publishable,false,"uncreated target starts blocked without evidence");
seed(candidateKey,event,[sources[0]]);
assert.equal(gate({...gateInput,requireIndependentVerification:false}).publishable,false,"create cannot opt out of independent verification");
seed(candidateKey,{...event,title:"Wrong second-source title"},[sources[1]]);
assert.equal(gate().publishable,false,"a disagreeing second URL is not corroboration");
seed(candidateKey,{title:event.title},[sources[1]]);
assert.equal(gate().publishable,false,"unpassed active regression still blocks");
recordMistakeTestResult({testKey,passed:true});
assert.equal(gate().publishable,true,"candidate is approved before an event ID exists");
const ordinarySingleSourceKey="candidate:ordinary-single-source";
seed(ordinarySingleSourceKey,event,[sources[0]]);
seed(ordinarySingleSourceKey,{
  venueName:event.venueName, address:event.address, dateStart:event.dateStart,
  dateEnd:event.dateEnd, status:event.status, posterImageUrl:event.posterImageUrl,
},[sources[1]]);
assert.equal(gate({...gateInput,candidateKey:ordinarySingleSourceKey}).publishable,true,
  "one primary source is enough for ordinary details when high-risk fields have two matching sources");
const founderEstimateKey="onyx-pnw-come-together-bar-night-2026-10-22";
const founderEstimateEvent={...event,title:"ONYX Come Together bar-night fixture",venueName:"Eagle Portland",address:"835 N Lombard St, Portland, OR 97217",dateStart:"2026-10-22T19:00:00-07:00",dateEnd:"2026-10-23T01:30:00-07:00"};
const {dateEnd: _founderEnd, ...founderVerifiedFields}=founderEstimateEvent;
seed(founderEstimateKey,founderVerifiedFields);
assert.equal(gate({...gateInput,candidateKey:founderEstimateKey,proposedValues:founderEstimateEvent}).publishable,true,
  "Tucker's exact ONYX cutoff may replace only independent end-time proof");
assert.equal(gate({...gateInput,candidateKey:founderEstimateKey,proposedValues:{...founderEstimateEvent,dateEnd:"2026-10-23T02:00:00-07:00"}}).publishable,false,
  "the founder exception does not authorize another end time");
const unrelatedEstimateKey="candidate:unrelated-estimated-end";
seed(unrelatedEstimateKey,founderVerifiedFields);
assert.equal(gate({...gateInput,candidateKey:unrelatedEstimateKey,proposedValues:founderEstimateEvent}).publishable,false,
  "the founder exception does not spread to other events");
seed(founderEstimateKey,{dateEnd:"2026-10-22T21:00:00-07:00"},[sources[0]]);
assert.equal(gate({...gateInput,candidateKey:founderEstimateKey,proposedValues:founderEstimateEvent}).publishable,false,
  "a conflicting end-time observation still requires review");
seed(candidateKey,{title:"New contradiction from the first source"},[sources[0]]);
assert.equal(gate().publishable,false,"new same-source contradiction supersedes older agreement, including equal checkedAt timestamps");
seed(candidateKey,{title:event.title},[sources[0]]);
assert.equal(gate().publishable,true,"a freshly corrected same-source observation restores matching proof");
const thirdSource="https://example.com/third-official-candidate-source";
seed(candidateKey,{title:"Contradictory current third-source title"},[thirdSource]);
assert.equal(gate().publishable,false,"two matching URLs cannot outvote a current primary-source disagreement");
assert.ok("conflictingEvidence" in gate() && (gate() as any).conflictingEvidence.includes("title"));
seed(candidateKey,{title:event.title},[thirdSource]);
assert.equal(gate().publishable,true,"fresh correction resolves the third-source disagreement without hiding history");
const trackingKey="candidate:tracking-variants";
seed(trackingKey,event,["https://example.com/official/events?utm_source=a&fbclid=one#poster","https://example.com/official/events?utm_source=b&gclid=two"]);
assert.equal(gate({...gateInput,candidateKey:trackingKey}).publishable,false,"tracking-only URL variants are one source, not independent proof");
const selectorKey="candidate:meaningful-selectors";
seed(selectorKey,event,["https://example.com/official/events?date=2027-11-15","https://example.com/official/events?date=2027-11-16"]);
assert.equal(gate({...gateInput,candidateKey:selectorKey}).publishable,true,"meaningful occurrence selectors retain distinct source identities; fixture facts still require actual agreement");
assert.equal(gate({...gateInput,fields:["title"],proposedValues:{title:event.title}}).publishable,false,"caller cannot shrink away mandatory fields");
assert.equal(gate({...gateInput,candidateKey:"candidate:wrong-identity"}).publishable,false,"evidence is exact-key scoped");
// Test-only second active run exercises receipt run scoping, not begin-run admission.
const otherRunId=randomUUID();
sqlite.prepare("INSERT INTO agent_research_runs (id,status,started_at) VALUES (?,'running',?)").run(otherRunId,checkedAt);
assert.equal(gate({...gateInput,runId:otherRunId}).publishable,false,"evidence from another run is not borrowed");
const staleKey="candidate:stale-proof";
seed(staleKey,event,sources,{checkedAt:new Date(Date.now()-31*86400000).toISOString()});
assert.equal(gate({...gateInput,candidateKey:staleKey}).publishable,false,"stale evidence blocks");
const secondaryKey="candidate:secondary-proof";
seed(secondaryKey,event,sources,{authorityLevel:"secondary"});
assert.equal(gate({...gateInput,candidateKey:secondaryKey}).publishable,false,"non-primary evidence cannot authorize create");
const conflict=recordConflict({runId:run.runId,candidateKey,field:"date-poster",values:["first","second"],material:true});
assert.equal(conflict.ok,true);if(!conflict.ok)throw Error(conflict.error);
assert.equal(gate().publishable,false,"all material candidate conflicts block, including compound field labels");
assert.equal(resolveResearchItem({kind:"conflict",id:conflict.conflictId,resolution:"Disposable conflicting fixture resolved by explicit test evidence."}).ok,true);
const review=enqueueResearchReview({runId:run.runId,candidateKey,reasonCode:"unresolved-candidate",detail:"A deliberate unresolved test review."});
assert.equal(review.ok,true);if(!review.ok)throw Error(review.error);
assert.equal(gate().publishable,false,"open candidate review blocks");
assert.equal(resolveResearchItem({kind:"review",id:review.reviewId,resolution:"Disposable missing-proof fixture now resolved."}).ok,true);
assert.equal(gate().publishable,true);
sqlite.prepare("UPDATE agent_mistake_tests SET last_run_at = ? WHERE test_key = ?").run("2000-01-01T00:00:00.000Z",testKey);
assert.equal(gate().publishable,false,"previous-run test pass does not authorize this run");
recordMistakeTestResult({testKey,passed:true});

const input={candidateKey,runId:run.runId,event,evidenceReceipts:Object.keys(event).map(field=>({field,sourceUrl:sources[0],checkedAt})),reason:"Create the fully evidenced disposable candidate fixture.",mistakeTestsPassed:true,idempotencyKey:`candidate-smoke-${randomUUID()}`};
const eventsBefore=storage.getEvents({}).length,changesBefore=listEventResearchChanges(200).length;
const preview=createEventFromResearch({...input,dryRun:true});
assert.equal(preview.ok,true);if(!preview.ok)throw Error(preview.error);
assert.equal(preview.event.id,null);
assert.equal(storage.getEvents({}).length,eventsBefore,"preview creates no placeholder event");
assert.equal(listEventResearchChanges(200).length,changesBefore,"preview creates no rollback ledger row");
const blockingAfterPreview=enqueueResearchReview({candidateKey,reasonCode:"new-conflict",detail:"New uncertainty arrived after preview."});
assert.equal(blockingAfterPreview.ok,true);if(!blockingAfterPreview.ok)throw Error(blockingAfterPreview.error);
assert.equal(createEventFromResearch({...input,dryRun:false}).ok,false,"real create rechecks, not a stale approved preview");
assert.equal(storage.getEvents({}).length,eventsBefore);
resolveResearchItem({kind:"review",id:blockingAfterPreview.reviewId,resolution:"New disposable review resolved."});
assert.equal(createEventFromResearch({...input,event:{...event,title:"Changed unevidenced title"}}).ok,false,"exact proposed values remain bound to evidence");
assert.equal(createEventFromResearch({...input,candidateKey:undefined} as any).ok,false,"no legacy ungated create bypass");
assert.equal(createEventFromResearch({...input,event:{...event,lockedFields:[]}}).ok,false,"no new lock override field");

const created=createEventFromResearch({...input,dryRun:false});
assert.equal(created.ok,true);if(!created.ok)throw Error(created.error);
assert.equal(created.event.source,"qsearch-2");
assert.deepEqual(created.event.eventTypes,["COMMUNITY"],"array-valued candidate evidence matches sanitized creation");
assert.ok(created.event.lockedFields.includes("posterImageUrl"));
assert.ok(created.rollback.available);
const evidenceRow=sqlite.prepare("SELECT count(*) AS n FROM agent_field_evidence WHERE entity_key=? AND event_id=?").get(candidateKey,created.event.id) as {n:number};
assert.ok(evidenceRow.n>=Object.keys(event).length*2,"candidate evidence is associated with created event atomically");
const replay=createEventFromResearch({...input,dryRun:false});
assert.equal(replay.ok,true);if(!replay.ok)throw Error(replay.error);
assert.equal(replay.idempotentReplay,true);
assert.equal(replay.event.id,created.event.id);
assert.equal(replay.rollback.token,created.rollback.token);
assert.equal(createEventFromResearch({...input,event:{...event,title:"Different payload"},dryRun:false}).ok,false,"idempotency key cannot change payload");
assert.equal(createEventFromResearch({...input,candidateKey:"candidate:changed-replay-target",dryRun:false}).ok,false,"candidateKey is part of the idempotency request hash");
const duplicateKey=`candidate:duplicate:${randomUUID()}`;seed(duplicateKey,event);
assert.equal(gate({...gateInput,candidateKey:duplicateKey}).publishable,false,"existing duplicate cannot become a new candidate");
assert.equal(createEventFromResearch({...input,candidateKey:duplicateKey,idempotencyKey:randomUUID()}).ok,false);

const failKey=`candidate:transaction:${randomUUID()}`,failEvent={...event,title:`Atomic candidate ${randomUUID()}`};seed(failKey,failEvent);
sqlite.exec(`CREATE TEMP TRIGGER fail_candidate_ledger BEFORE INSERT ON agent_event_change_log WHEN NEW.reason='Deliberate candidate ledger failure fixture.' BEGIN SELECT RAISE(ABORT,'fixture ledger failure'); END`);
const failure=createEventFromResearch({...input,candidateKey:failKey,event:failEvent,idempotencyKey:randomUUID(),reason:"Deliberate candidate ledger failure fixture."});
assert.equal(failure.ok,false);if(!failure.ok)assert.equal(failure.status,500);
assert.ok(!storage.getEvents({}).some(e=>e.title===failEvent.title),"failed ledger rolls back event insertion");
assert.equal((sqlite.prepare("SELECT count(*) AS n FROM agent_field_evidence WHERE entity_key=? AND event_id IS NOT NULL").get(failKey) as {n:number}).n,0,"failed create does not bind candidate receipts");
sqlite.exec("DROP TRIGGER fail_candidate_ledger");
assert.equal(rollbackEventResearchChange(created.rollback.token).ok,true);
assert.equal(storage.getEvent(created.event.id)?.status,"HIDDEN","created-event rollback remains non-destructive");
assert.equal(finishResearchRun({runId:run.runId}).ok,true);
assert.equal(finishResearchRun({runId:otherRunId}).ok,true);
console.log("QSearch candidate gate: migration, exact evidence/run/value scope, conflicts/review, freshness, independent proof, regressions, create preview/recheck, locks, duplicates, idempotency and atomic rollback passed.");
