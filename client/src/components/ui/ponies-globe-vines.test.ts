import test from "node:test";
import assert from "node:assert/strict";
import { VINE_ANCHORS, VINE_CONNECTIONS, vineMesh } from "./ponies-globe-vines";

test("60% fewer clusters stay evenly spaced and one connected network", () => {
  assert.equal(VINE_ANCHORS.length, 30 * .4);
  const heights = VINE_ANCHORS.map(a => Math.sin(a.lat)).sort((a,b)=>a-b);
  for(let i=1;i<heights.length;i++) assert.ok(Math.abs(heights[i]-heights[i-1]-2/12)<1e-10);
  const seen=new Set([0]);
  for(let i=0;i<12;i++) for(const [a,b] of VINE_CONNECTIONS) if(seen.has(a)||seen.has(b)) { seen.add(a);seen.add(b); }
  assert.equal(seen.size,12);
  assert.equal(VINE_CONNECTIONS.length,11);
});

test("stems split at the globe limb and remain finite at every rotation", () => {
  for(const yaw of [0,.8,1.6,2.4,3.2,4,4.8,5.6]) {
    const mesh=vineMesh(320,320,280,1000,false,yaw);
    const stems=mesh.filter(p=>p.stem);
    assert.ok(stems.some(p=>p.z<0));assert.ok(stems.some(p=>p.z>=0));
    for(const patch of stems) for(const p of patch.stem!) {
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z));
      assert.equal(p.z<0,patch.z<0);
    }
  }
});
