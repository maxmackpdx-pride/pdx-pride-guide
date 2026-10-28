import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  e3CrowdTargets,e3CrowdEase,e3BlenderFootprintPx,E3_CROWD_MIN_SCALE,E3_CROWD_READABLE_PX,E3_CROWD_RELEASE,E3_BLENDER_MAX_SCREEN_FRACTION,E3_BLENDER_ZOOM_OUT_GROWTH,
  e3BlenderSizeFactor,e3BlenderScaleMeters,e3BlenderScreenHeightPx,e3BlenderTakesOver,e3AnchorCoordinates,e3CoordKey,placezHoverMeters,
  E3_BLENDER_SCALE_CLOSE_M,E3_BLENDER_SCALE_CLOSE_ZOOM,E3_BLENDER_SIZE_FULL_ZOOM,E3_BLENDER_SIZE_FAR_ZOOM,E3_BLENDER_SIZE_FAR,
  E3_BLENDER_MIN_SCREEN_PX,PLACEZ_HOVER_METERS,e3RingText,e3CountdownText,e3NearestSameDayEvent,E3_RING_TEXT_MAX_CHARS,e3RingLines,e3TimeLabel,e3ComplementColor,e3VortexTint,e3SlideCycle,e3SlideState,E3_SLIDE_WEIGHTS,e3CountdownParts,e3FaceStack,e3SameDayEventsSorted,e3CleanCopy,E3_SAME_DAY_GREEN,PLACEZ_ROOF_CLEARANCE_METERS,E3_SAME_DAY_VORTEX_FAR_OVERVIEW,
} from '../client/public/mapz-map/e3-lod.js';
import {blenderLogoFace,blenderBandFace,blenderPlateFace,blenderArtFace,blenderOrbFace,blenderDotsHole,BLENDER_TABLES} from '../client/public/mapz-map/e3-blender-model.js';

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

test('ring lines: event name first, DJs second, host or group when no DJ is listed, venue as the last fallback, no dashes', () => {
  assert.deepEqual(e3RingLines({eventName:'Little Shop of Ponies',performers:['DJ Grind','DJ Moss'],hostName:'Pink Ponies',venueName:'Secret Warehouse'}),{name:'LITTLE SHOP OF PONIES',sub:'DJ GRIND \u00b7 DJ MOSS',source:'performers'});
  assert.deepEqual(e3RingLines({eventName:'Bear Dance',hostName:'Portland Bears',venueName:'CC Slaughters'}),{name:'BEAR DANCE',sub:'PORTLAND BEARS',source:'host'});
  assert.deepEqual(e3RingLines({eventName:'Bear Dance',venueName:'CC Slaughters'}),{name:'BEAR DANCE',sub:'CC SLAUGHTERS',source:'venue'});
  assert.equal(e3RingLines({eventName:"Coach's Pet \u2014 Yes Coach"}).name,"COACH'S PET - YES COACH");
  assert.equal(e3CleanCopy('a \u2013 b'),'A - B');
});

test('start time label: 9PM, 9:30PM, no :00, no dashes', () => {
  assert.equal(e3TimeLabel('9:00 PM'),'9PM');
  assert.equal(e3TimeLabel('9:30 PM'),'9:30PM');
  assert.equal(e3TimeLabel('10 am'),'10AM');
  assert.equal(e3TimeLabel('21:00'),'9PM');
  assert.equal(e3TimeLabel('12:00 AM'),'12AM');
  assert.ok(!/[\u2012-\u2015]/.test(e3TimeLabel('9 \u2014 10 PM')));
});

test('complementary accents: green gets purple, magenta gets green, red gets cyan', () => {
  const hue=hex=>{const n=parseInt(hex.slice(1),16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255,max=Math.max(r,g,b),d=max-Math.min(r,g,b);const h=d?max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4:0;return (h*60+360)%360;};
  for (const tint of ['#39FF14','#FF00CC','#FF0000','#19E3FF']) {
    const gap=Math.abs(hue(e3ComplementColor(tint))-hue(tint));
    assert.ok(Math.abs(gap-180)<6,`${tint} accent is opposite on the wheel`);
  }
  assert.equal(e3ComplementColor('#FF00CC'),'#3DFF64');
});

test('Sanctuary and the other adult venues stay red in the vortex; every other same-day vortex is green', () => {
  assert.equal(e3VortexTint('#FF0000',true),'#FF0000');
  assert.equal(e3VortexTint('#ff0000',true),'#FF0000');
  assert.equal(e3VortexTint('#FF00CC',true),E3_SAME_DAY_GREEN);
  assert.equal(e3VortexTint('#FF00CC',false),'#FF00CC');
});

test('screen art cycle: logo owns at least 60% of the time, glitch only at swaps, static logo for reduced motion', () => {
  assert.equal(E3_SLIDE_WEIGHTS.logo,60);
  for (const kinds of [['logo','poster','host'],['logo','poster'],['logo','host']]) {
    const cycle=e3SlideCycle(kinds),total=cycle.reduce((sum,part)=>sum+part.end-part.start,0),logo=cycle.filter(part=>part.kind==='logo').reduce((sum,part)=>sum+part.end-part.start,0);
    assert.ok(Math.abs(total-12)<1e-9,'the cycle fills the period');
    assert.ok(logo/total>=.6-1e-9,`logo share ${(logo/total).toFixed(2)} for ${kinds}`);
    for (const kind of kinds) assert.ok(cycle.some(part=>part.kind===kind),`${kind} appears`);
  }
  const seconds=[...Array(1200)].map((_,i)=>i/100);
  const states=seconds.map(t=>e3SlideState(['logo','poster','host'],t));
  const glitching=states.filter(state=>state.glitch>0).length/states.length;
  assert.ok(glitching>0&&glitching<.2,'short glitch windows only');
  assert.ok(states.every(state=>state.glitch===0||state.from!==state.to),'a glitch is always a swap');
  const onScreen=kind=>states.filter(state=>(state.mix<.5?state.from:state.to)===kind).length/states.length;
  assert.ok(onScreen('logo')>=.58,'logo gets the most screen time');
  assert.ok(onScreen('poster')>onScreen('host'),'poster shows longer than the host logo');
  for (const t of seconds) {
    const calm=e3SlideState(['logo','poster','host'],t,{reduced:true});
    assert.deepEqual(calm,{from:'logo',to:'logo',mix:0,glitch:0});
  }
  assert.equal(e3SlideState(['logo'],5).glitch,0,'a lone logo never glitches');
});

test('countdown parts: big numerals with unit letters, d:h from a day out, h:m:s inside a day, LIVE once started', () => {
  const now=1e12,H=3600e3;
  assert.deepEqual(e3CountdownParts(now+3*H+5e3,now),[{value:'03',unit:'h'},{value:'00',unit:'m'},{value:'05',unit:'s'}]);
  assert.deepEqual(e3CountdownParts(now+30*H+5e3,now),[{value:'01',unit:'d'},{value:'06',unit:'h'}]);
  assert.deepEqual(e3CountdownParts(now+7*24*H+7*H,now).map(part=>part.unit),['d','h']);
  assert.equal(e3CountdownParts(now-1,now)[0].live,true);
  assert.deepEqual(e3CountdownParts(NaN,now),[]);
});

test('face stack: initials of people who RSVP\'d, friends first when marked, nothing when nobody did', () => {
  assert.deepEqual(e3FaceStack([],0),{people:[],more:0});
  assert.deepEqual(e3FaceStack(undefined,undefined),{people:[],more:0});
  assert.deepEqual(e3FaceStack([{initial:'pon'},{initial:'mtk'}],7),{people:['PON','MTK'],more:5});
  assert.deepEqual(e3FaceStack([{initial:'ab'},{initial:'cd',friend:true}],2),{people:['CD'],more:1},'friends win when the host marks them');
  assert.equal(e3FaceStack([1,2,3,4,5,6].map(n=>({initial:String(n)})),6).people.length,4);
});

test('same-day events are sorted nearest first for the screens of a stack', () => {
  const now=1e12,H=3600e3;
  const list=e3SameDayEventsSorted([{startsAtMs:now+5*H,name:'b'},{startsAtMs:now+30*H,name:'far'},{startsAtMs:now+2*H,name:'a'},{startsAtMs:now-H,name:'begun'}],now,3);
  assert.deepEqual(list.map(event=>event.name),['a','b','begun']);
});

test('v2 model tables: art, info bands, text rings, orb and the dots cut-out only exist on the vortex and the stack', () => {
  const {ART_MAIN,ART_LOWER,RING_BANDS,INFO_MAIN,FACE_STACK,COUNTDOWN_PLATE}=BLENDER_TABLES;
  for (const stage of [0,1,2,3]) {
    assert.equal(blenderArtFace(ART_MAIN,stage).opacity,0);
    assert.equal(blenderArtFace(INFO_MAIN,stage).opacity,0);
    assert.equal(blenderOrbFace(stage).opacity,0);
    assert.equal(blenderPlateFace(stage,FACE_STACK).opacity,0);
    assert.equal(blenderPlateFace(stage,COUNTDOWN_PLATE).opacity,0);
    for (const band of RING_BANDS) assert.equal(blenderBandFace(band,stage).opacity,0);
  }
  assert.equal(blenderArtFace(ART_MAIN,4).opacity,1);
  assert.equal(blenderArtFace(ART_LOWER,4).opacity,0,'the second screen is the double stack only');
  assert.equal(blenderArtFace(ART_LOWER,5).opacity,1);
  assert.deepEqual(RING_BANDS.map(band=>[band.id,blenderBandFace(band,4).opacity]),[['a1',1],['a2',1],['b2',0],['b1',0]]);
  assert.deepEqual(RING_BANDS.map(band=>blenderBandFace(band,5).opacity),[1,1,1,1]);
  assert.ok(blenderOrbFace(5).y>blenderOrbFace(4).y,'the orb floats between the stacks, above the single vortex base');
  assert.ok(blenderPlateFace(4,FACE_STACK).y>blenderPlateFace(4,COUNTDOWN_PLATE).y,'faces sit above the clock');
  assert.equal(blenderDotsHole(3).on,false);
  assert.equal(blenderDotsHole(4).on,true);
  // The info band (time and name) sits under the art on the same screen.
  assert.ok(blenderArtFace(INFO_MAIN,4).y<blenderArtFace(ART_MAIN,4).y);
});

test('river-flight and the model wire the v2 vortex without fake dates', async () => {
  const flight=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
  const model=await readFile(new URL('../client/public/mapz-map/e3-blender-model.js',import.meta.url),'utf8');
  assert.match(flight,/e3VortexTint\(g\.color,true\)/);
  assert.match(flight,/e3SameDayEventsSorted\(g\.events,lodNow,stage>=5\?2:1\)/);
  assert.match(flight,/countdown:e3CountdownParts\(nearest\.startsAtMs,lodNow\)/);
  assert.match(flight,/faces:e3FaceStack\(nearest\.avatars,nearest\.avatarTotal\)/);
  assert.match(flight,/e3RingLines\(\{eventName:event\.name,performers:event\.performers,hostName:event\.hostName/);
  assert.match(flight,/sameDayVortex=g\.sameDay&&stage>=4/);
  assert.match(flight,/absolute\.origin!==location\.origin/,'posters are same-origin only');
  assert.match(model,/item\.model\.setContent\(row\.content/);
  assert.match(model,/for\(const texture of \[\.\.\.textures\]\)texture\.dispose\(\)/,'every canvas texture is disposed');
  assert.match(model,/e3SlideState\(slide\.kinds,elapsed/);
  assert.ok(!/Date\.now\s*=|fakeNow|mockNow/.test(flight+model),'no fake clock in the product');
  assert.ok(!/[\u2014\u2013]/.test(model.replace(/\/\/.*$/gm,'')),'no dashes in drawn copy');
});
