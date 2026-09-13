import test from 'node:test';
import assert from 'node:assert/strict';
import { glassEdgeSample, glassEdgeDisplacement, encodeGlassDisplacement } from '../client/src/lib/dockLens.ts';
import { dockLensParameters as dockOpticalParameters } from '../client/src/lib/dockLens.ts';
import { supportsDockRefraction } from '../client/src/lib/dockMaterial.ts';

test('central field and inner shoulder have exactly zero displacement', () => {
  for (const [w,h] of [[304,82],[374,82],[414,82],[56,56],[180,68]]) {
    for (const x of [-w/4,0,w/4]) assert.deepEqual(glassEdgeDisplacement(x,0,w,h),[0,0]);
    assert.deepEqual(glassEdgeDisplacement(0,-h/2+12,w,h),[0,0]);
  }
});
test('straight rim normals are perpendicular, not aimed at the dock center', () => {
  const top = glassEdgeDisplacement(90,-39,374,82);
  const left = glassEdgeDisplacement(-185,5,374,82);
  assert.equal(Math.abs(top[0]),0); assert.ok(top[1]>0);
  assert.ok(left[0]>0); assert.equal(Math.abs(left[1]),0);
});
test('corner normals rotate continuously with the rounded boundary', () => {
  for (const angle of [.05,.3,.6,.9,1.3,1.52]) {
    const [dx,dy] = glassEdgeDisplacement(159+26*Math.cos(angle),13+26*Math.sin(angle),374,82);
    assert.ok(Math.abs(dy/dx-Math.tan(angle))<1e-9);
  }
});
test('inner shoulder fades smoothly to the flat center', () => {
  const a=glassEdgeDisplacement(0,-29.001,374,82)[1];
  const b=glassEdgeDisplacement(0,-29.01,374,82)[1];
  assert.ok(a>=0 && a<1e-10); assert.ok(b>a && b<1e-8);
});
test('lens map remains bounded throughout rectangle-to-circle collapse', () => {
  for(let step=0;step<=20;step++) {
    const w=374-(374-56)*step/20,h=82-26*step/20;
    for(let y=-h/2;y<=h/2;y+=3) for(let x=-w/2;x<=w/2;x+=3) {
      const s=glassEdgeSample(x,y,w,h);
      assert.ok(Number.isFinite(s.dx+s.dy+s.reflection));
      assert.ok(Math.hypot(s.dx,s.dy)<=.380001);
      assert.ok(s.reflection>=0 && s.reflection<.2);
    }
  }
});
test('reflection is directional and absent from the central field', () => {
  assert.equal(glassEdgeSample(0,0,374,82).reflection,0);
  assert.ok(glassEdgeSample(-177,-31,374,82).reflection>glassEdgeSample(177,-31,374,82).reflection);
});
test('8-bit neutral displacement decodes to exactly zero at the center', () => {
  const neutral=encodeGlassDisplacement(0);
  assert.equal(neutral,128);
  assert.ok(Math.abs(neutral/255*(255/254)-1/254-.5)<1e-15);
});
test('scroll speed does not rotate or stretch the lens geometry', () => {
  for(const material of ['m3','hybrid']) {
    assert.deepEqual(dockOpticalParameters(82,3,material),dockOpticalParameters(82,0,material));
    assert.equal(dockOpticalParameters(56,-3,material).stretch,1);
  }
});
test('Safari, iOS Chrome and iPad desktop UA choose the translucent fallback', () => {
  const nav=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const css=Object.getOwnPropertyDescriptor(globalThis,'CSS');
  try {
    Object.defineProperty(globalThis,'CSS',{configurable:true,value:{supports:()=>true}});
    for(const [ua,platform,touches,expected] of [
      ['Mozilla/5.0 Macintosh Version/26.0 Safari/605.1.15','MacIntel',0,false],
      ['Mozilla/5.0 iPhone Version/26.0 Mobile Safari/604.1','iPhone',5,false],
      ['Mozilla/5.0 iPhone CriOS/140.0 Mobile Safari/604.1','iPhone',5,false],
      ['Mozilla/5.0 Chrome/140.0 Safari/537.36','MacIntel',5,false],
      ['Mozilla/5.0 Chrome/140.0 Safari/537.36','MacIntel',0,true],
    ]) {
      Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:ua,platform,maxTouchPoints:touches}});
      assert.equal(supportsDockRefraction(),expected,ua);
    }
  } finally {
    if(nav) Object.defineProperty(globalThis,'navigator',nav); else delete globalThis.navigator;
    if(css) Object.defineProperty(globalThis,'CSS',css); else delete globalThis.CSS;
  }
});
