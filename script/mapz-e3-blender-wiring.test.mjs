import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  e3CrowdTargets,e3CrowdEase,e3BlenderFootprintPx,E3_CROWD_MIN_SCALE,E3_CROWD_READABLE_PX,E3_CROWD_RELEASE,E3_BLENDER_MAX_SCREEN_FRACTION,E3_BLENDER_ZOOM_OUT_GROWTH,
  e3BlenderSizeFactor,e3BlenderScaleMeters,e3BlenderScreenHeightPx,e3BlenderTakesOver,e3AnchorCoordinates,e3CoordKey,placezHoverMeters,
  E3_BLENDER_SCALE_CLOSE_M,E3_BLENDER_SCALE_CLOSE_ZOOM,E3_BLENDER_SIZE_FULL_ZOOM,E3_BLENDER_SIZE_FAR_ZOOM,E3_BLENDER_SIZE_FAR,
  E3_BLENDER_MIN_SCREEN_PX,PLACEZ_HOVER_METERS,e3RingText,e3CountdownText,e3NearestSameDayEvent,E3_RING_TEXT_MAX_CHARS,PLACEZ_ROOF_CLEARANCE_METERS,E3_SAME_DAY_VORTEX_FAR_OVERVIEW,
} from '../client/public/mapz-map/e3-lod.js';
import {blenderLogoFace,blenderBandFace,blenderPlateFace} from '../client/public/mapz-map/e3-blender-model.js';

test('3D hologram scale: 24 m at close zoom, 20% at zoom 12, full size from 15.5, smooth in between', () => {
  assert.equal(E3_BLENDER_SCALE_CLOSE_M,24);
  assert.equal(E3_BLENDER_SCALE_CLOSE_ZOOM,17.5);
  for (const zoom of [17.5,17.8,18.5,20]) assert.equal(e3BlenderScaleMeters(zoom),24,`z${zoom} is the close scale`);
  assert.equal(e3BlenderSizeFactor(E3_BLENDER_SIZE_FAR_ZOOM),E3_BLENDER_SIZE_FAR);
  assert.equal(E3_BLENDER_SIZE_FAR,.2);
  assert.equal(e3BlenderSizeFactor(E3_BLENDER_SIZE_FULL_ZOOM),1);
  assert.equal(e3BlenderSizeFactor(16.5),1);
  assert.equal(e3BlenderSizeFactor(8),E3_BLENDER_SIZE_FAR);
  // The size factor is monotonic and smooth (no jump bigger than a tenth of a zoom step allows).
  let previous=e3BlenderSizeFactor(11);
  for (let zoom=11.05;zoom<=17;zoom+=.05) {
    const factor=e3BlenderSizeFactor(zoom);
    assert.ok(factor>=previous-1e-12,`monotonic at z${zoom.toFixed(2)}`);
    assert.ok(factor-previous<.05,`smooth at z${zoom.toFixed(2)}`);
    previous=factor;
  }
});

test('3D hologram scale eases down toward mid zoom, stays readable, and is capped to a share of the screen', () => {
  const px=(zoom,view=900)=>e3BlenderScreenHeightPx(3,zoom,45.52,50,view);
  assert.equal(E3_BLENDER_ZOOM_OUT_GROWTH<1,true,'on-screen size eases down as the map zooms out');
  assert.ok(px(15.5)<px(17.5)&&px(15.5)>.6*px(17.5),'mid zoom is smaller than close but still large');
  // 20% of the full size at zoom 12 on top of that, and still above the takeover minimum a little further in.
  assert.ok(px(12)<.35*px(15.5));
  assert.ok(px(13.5)>=E3_BLENDER_MIN_SCREEN_PX);
  // Zooming in past the close zoom never lets the tallest stage pass the viewport share.
  for (const zoom of [17.5,17.8,18.5,19.5]) {
    const stack=e3BlenderScreenHeightPx(5,zoom,45.52,50,900);
    assert.ok(stack<=E3_BLENDER_MAX_SCREEN_FRACTION*900+1,`stack at z${zoom} is ${stack.toFixed(0)}px, under ${E3_BLENDER_MAX_SCREEN_FRACTION*900}px`);
  }
  // Without a viewport the ramp is the plain 24 m close scale.
  assert.equal(e3BlenderScaleMeters(18.5),24);
  assert.ok(e3BlenderScaleMeters(15.5)>=3*E3_BLENDER_SCALE_CLOSE_M*.99,'much larger than the old fixed 6 m');
});

test('crowd scaling: isolated holograms stay full size, a close pair shrinks together to the floor, never below it', () => {
  const item=(key,x,y,widthPx=200,heightPx=300)=>({key,x,y,widthPx,heightPx});
  const alone=e3CrowdTargets([item('a',100,100),item('b',900,100)]);
  assert.equal(alone.get('a'),1);assert.equal(alone.get('b'),1);
  // Touching distance is exactly the average width; half of that shrinks both to the ratio.
  const pair=e3CrowdTargets([item('a',100,100),item('b',250,100)]);
  assert.ok(Math.abs(pair.get('a')-.75)<1e-9);assert.equal(pair.get('a'),pair.get('b'));
  // Very close: clamps at the floor.
  const stacked=e3CrowdTargets([item('a',100,100),item('b',110,100)]);
  assert.equal(stacked.get('a'),E3_CROWD_MIN_SCALE);
  assert.ok(E3_CROWD_MIN_SCALE>=.6&&E3_CROWD_MIN_SCALE<=.7);
  // Three in a row: only the crowded middle pair members shrink; the far one stays full.
  const row=e3CrowdTargets([item('a',0,0),item('b',150,0),item('c',1000,0)]);
  assert.ok(row.get('a')<1&&row.get('b')<1&&row.get('c')===1);
  // Readable floor: a small hologram is not shrunk below the readable height.
  const small=e3CrowdTargets([item('a',100,100,60,70),item('b',110,100,60,70)]);
  assert.ok(small.get('a')*70>=Math.min(70,E3_CROWD_READABLE_PX)-1e-9);
  // Hysteresis: a pair just past touching keeps shrinking once shrunk, but a fresh pair stays full.
  const nearlyClear=[item('a',100,100),item('b',310,100)];
  assert.equal(e3CrowdTargets(nearlyClear,new Map()).get('a'),1);
  assert.ok(E3_CROWD_RELEASE>1);
  assert.ok(e3CrowdTargets(nearlyClear,new Map([['a',.8]])).get('a')<1,'still shrunk inside the release margin');
  assert.equal(e3CrowdTargets([item('a',100,100),item('b',100+200*E3_CROWD_RELEASE+1,100)],new Map([['a',.8]])).get('a'),1,'released once clear');
});

test('crowd easing is smooth, frame-rate independent and lands exactly on the target', () => {
  let value=1;const steps=[];
  for (let i=0;i<60;i++) {value=e3CrowdEase(value,.7,1/60);steps.push(value);}
  assert.ok(steps.every((v,i)=>i===0||v<=steps[i-1]+1e-12),'monotonic');
  assert.ok(steps[0]-.7>.25,'no jump on the first frame');
  assert.equal(steps.at(-1),.7);
  const one=e3CrowdEase(1,.7,.5),two=e3CrowdEase(e3CrowdEase(1,.7,.25),.7,.25);
  assert.ok(Math.abs(one-two)<1e-9,'same result for one 0.5 s step or two 0.25 s steps');
  assert.equal(e3CrowdEase(.9,.7,0),.9);
});

test('footprint grows with scale and stage height', () => {
  const small=e3BlenderFootprintPx(4,10,16,45.52,50),big=e3BlenderFootprintPx(4,20,16,45.52,50);
  assert.ok(Math.abs(big.widthPx/small.widthPx-2)<1e-9&&Math.abs(big.heightPx/small.heightPx-2)<1e-9);
  assert.ok(e3BlenderFootprintPx(5,10,16).heightPx>e3BlenderFootprintPx(2,10,16).heightPx);
});

test('3D takeover: only compressed or closer and big enough; a leaving venue is held until its tween ends', () => {
  const view={zoom:15.5,latitude:45.52,pitch:55};
  assert.equal(e3BlenderTakesOver({targetStage:1,...view}),false,'mini badge stays 2D');
  assert.equal(e3BlenderTakesOver({targetStage:2,...view}),true);
  assert.equal(e3BlenderTakesOver({targetStage:3,...view}),true);
  assert.equal(e3BlenderTakesOver({targetStage:5,...view}),true);
  assert.equal(e3BlenderTakesOver({targetStage:1,shownStage:1.6,...view}),true,'tween still above the waypoint: keep the 3D model');
  assert.equal(e3BlenderTakesOver({targetStage:1,shownStage:1.01,...view}),false,'tween done: hand back to the 2D mini badge');
  // Too small to read: the 2D path keeps the venue.
  assert.equal(e3BlenderTakesOver({targetStage:3,zoom:3,latitude:45.52,pitch:0}),false);
  assert.equal(E3_SAME_DAY_VORTEX_FAR_OVERVIEW,false,'far-overview flag stays off by default');
});

test('3D anchor: the snapped building point the 2D pin uses, at the pin hover height', () => {
  const raw=[-122.680179337043,45.523244045755],snapped=[-122.67990,45.52330];
  const snaps=new Map([[e3CoordKey(raw),snapped]]);
  assert.equal(e3CoordKey(raw),'-122.680179,45.523244');
  assert.deepEqual(e3AnchorCoordinates(raw,snaps),snapped);
  const other=[-122.6,45.5];
  assert.equal(e3AnchorCoordinates(other,snaps),other,'no snap: the raw coordinate');
  assert.equal(e3AnchorCoordinates(raw,undefined),raw);
  assert.deepEqual(e3AnchorCoordinates(raw,new Map([[e3CoordKey(raw),[NaN,1]]])),raw,'bad snap is ignored');
  // Hover: 3 m at no extrusion, roof + 4 m at full extrusion (the 2D pin rule).
  assert.equal(PLACEZ_HOVER_METERS,3);
  assert.equal(PLACEZ_ROOF_CLEARANCE_METERS,4);
  assert.equal(placezHoverMeters(40,0),3);
  assert.equal(placezHoverMeters(40,1),44);
  assert.equal(placezHoverMeters(40,.5),23.5);
  assert.equal(placezHoverMeters(-5,1),3,'a very low roof never sinks the pin below the base hover');
  assert.equal(placezHoverMeters(1,1),5);
});

test('venue logo faces: logo fits the coin and the screens, fades in after the waypoint, second screen only on the stack', () => {
  const wide=blenderLogoFace({y:[0,0,0,0,0,0],w:[0,0,.3,.8,1,1],h:[0,0,.3,.8,.7,.7],a:[0,0,1,1,1,1]},3,4);
  assert.ok(Math.abs(wide.width/wide.height-4)<1e-9,'aspect is kept');
  assert.ok(wide.width<=.8+1e-9&&wide.height<=.8+1e-9,'fits the coin box');
  const tall=blenderLogoFace({y:[0,0,0,0,0,0],w:[0,0,.3,.8,1,1],h:[0,0,.3,.8,.7,.7],a:[0,0,1,1,1,1]},4,.5);
  assert.ok(tall.height<=.7+1e-9&&tall.width<=1);
});

test('river-flight wires the new rules: no fixed 6 m scale, cancel clips for 3D venues, snap table invalidates the projection', async () => {
  const source=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  assert.ok(!/E3_BLENDER_SCALE_M\b/.test(source),'fixed scale constant is gone');
  assert.match(source,/scaleMeters:e3BlenderScaleMeters\(/);
  assert.match(source,/e3BlenderTakesOver\(/);
  assert.match(source,/e3CrowdTargets\(crowdItems,e3CrowdFactor\)/);
  assert.match(source,/e3AnchorCoordinates\(anchor\.feature\.geometry\.coordinates,window\.__mapzPlaceSnaps\)/);
  assert.match(source,/placezHoverMeters\(anchorRoof/);
  assert.match(source,/e3Transitions\.cancel\(/);
  assert.match(source,/window\.__mapzPlaceSnaps!==e3SnapTable/);
  assert.match(source,/!e3StageTweenActive\)return;/,'an idle camera still renders frames while the stage morph runs');
  assert.match(source,/const E3_BLENDER_SKYLINE_HEIGHT=false;/);
});

test('text ring copy: venue, event titles, time, uppercase, middle dots, never an em dash, bounded length', () => {
  assert.equal(e3RingText({venueName:'Sanctuary Club',eventNames:['Saturday Night'],time:'9:00 PM'}),'SANCTUARY CLUB \u00b7 SATURDAY NIGHT \u00b7 9:00 PM');
  assert.equal(e3RingText({venueName:'Badlands',eventNames:['Badlands','Drag Bingo'],time:''}),'BADLANDS \u00b7 DRAG BINGO','duplicates are dropped');
  const long=e3RingText({venueName:'A'.repeat(80),eventNames:['Late show'],time:'9 PM'});
  assert.ok(long.length<=E3_RING_TEXT_MAX_CHARS,'a long venue name is cut');
  assert.equal(long,'A'.repeat(E3_RING_TEXT_MAX_CHARS),'later parts that do not fit are skipped');
  const dashed=e3RingText({venueName:'Pride \u2014 Night',eventNames:['A \u2013 B'],time:''});
  assert.ok(!/[\u2012-\u2015]/.test(dashed),'no em or en dashes');
  assert.equal(e3RingText({}),'');
});

test('countdown copy matches the 2D digital readout and follows the viewTime clock', () => {
  const now=Date.UTC(2026,9,31,1,0,0);
  assert.equal(e3CountdownText(now+3*3600e3+5e3,now),'03h : 00m : 05s');
  assert.equal(e3CountdownText(now+3*3600e3,now+1e3),'02h : 59m : 59s','one second later it ticks');
  assert.equal(e3CountdownText(now+20*60e3,now),'20m : 00s');
  assert.equal(e3CountdownText(now-60e3,now),'LIVE');
  assert.equal(e3CountdownText(NaN,now),'');
});

test('nearest same-day event: the soonest upcoming one keeps the countdown, later or far events never do', () => {
  const now=1e12,H=3600e3;
  const events=[{startsAtMs:now+5*H,name:'late'},{startsAtMs:now+2*H,name:'soon'},{startsAtMs:now+30*H,name:'tomorrow'},{startsAtMs:now-H,name:'begun'}];
  assert.equal(e3NearestSameDayEvent(events,now).name,'soon');
  assert.equal(e3NearestSameDayEvent([events[2]],now),null,'beyond 24h there is no same-day event');
  assert.equal(e3NearestSameDayEvent([events[3],events[2]],now).name,'begun');
});

test('ring band and countdown plate show only on the vortex and the double stack, and rise into place', () => {
  for (const stage of [0,1,2,3]) {
    assert.equal(blenderBandFace({y:[2.9,2.9,2.9,2.9,2.88,3.72],r:[.6,.6,.6,.6,1.1,1.1],h:[.4,.4,.4,.4,.44,.44],a:[0,0,0,0,1,1]},stage).opacity,0);
    assert.equal(blenderPlateFace(stage).opacity,0,`no countdown plate at stage ${stage}`);
  }
  assert.equal(blenderPlateFace(4).opacity,1);
  assert.equal(blenderPlateFace(5).opacity,1);
  assert.ok(blenderPlateFace(5).y>blenderPlateFace(4).y,'the plate rides above the top screen of the stack');
  const mid=blenderPlateFace(3.5);
  assert.ok(mid.opacity>0&&mid.opacity<1,'fades in during the coin to vortex morph');
});

test('river-flight and the model wire the ring text and countdown without fake dates', async () => {
  const flight=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const model=await readFile(new URL('../client/public/mapz-map/e3-blender-model.js',import.meta.url),'utf8');
  assert.match(flight,/ringText:nearest\?e3RingText\(/);
  assert.match(flight,/countdown:nearest\?e3CountdownText\(nearest\.startsAtMs,lodNow\)/);
  assert.match(flight,/sameDayVortex=g\.sameDay&&stage>=4/);
  assert.match(model,/item\.model\.setRingText\(row\.ringText/);
  assert.match(model,/item\.model\.setCountdown\(row\.countdown/);
  assert.match(model,/ringTexture\?\.dispose\(\);ringFarTexture\?\.dispose\(\);countdownTexture\?\.dispose\(\)/,'canvas textures are disposed');
  assert.ok(!/Date\.now\s*=|fakeNow|mockNow/.test(flight+model),'no fake clock in the product');
});
