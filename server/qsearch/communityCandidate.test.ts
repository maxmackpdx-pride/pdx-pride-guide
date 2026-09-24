import assert from "node:assert/strict";
import { test } from "node:test";
import { buildScanCandidates } from "./analyze";

test("QSearch evaluates a group match even when its event is already on the board", () => {
  const draft = {
    title:"Group Party",description:"A group event",venueName:"Example Hall",address:null,neighborhood:null,lat:null,lng:null,
    dateStart:"2026-11-15T19:00:00",dateEnd:"2026-11-15T22:00:00",dayOfWeek:"SUN",ageRequirement:"21+",
    eventTypes:"Community",admission:"Free",ticketUrl:null,isPublic:true,isPrivate:false,isHouseParty:false,
    isSexPositive:false,nudityOk:false,posterImageUrl:null,sourceUrl:null,parseSource:"ics" as const,warnings:[],
  };
  const seen:number[]=[];
  const remaining=buildScanCandidates([{draft,sourceId:"test",sourceLabel:"Example Hall",sourceUrl:"https://example.org"}],
    [{id:42,...draft,status:"LIVE"} as any],[],{onCandidateEvaluated:c=>{if(c.strongDuplicate?.confidence==="high")seen.push(c.strongDuplicate.eventId);}});
  assert.deepEqual(seen,[42]);
  assert.equal(remaining.length,0);
});
